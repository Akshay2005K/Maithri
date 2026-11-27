import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  createLiveKitToken,
  deleteLiveKitRoom,
  LiveKitUnavailableError,
} from "@/lib/livekitServer";

const ALLOWED_ACTIONS = new Set(["accept", "decline", "end"]);
export const STALE_RINGING_MS = 60_000;

export async function bothCallParticipantsOnline(
  admin: SupabaseClient,
  callerId: string,
  calleeId: string,
  connectedBefore = new Date().toISOString()
) {
  const { data, error } = await admin.from("call_presence")
    .select("user_id")
    .in("user_id", [callerId, calleeId])
    .eq("closed", false)
    .gt("expires_at", new Date().toISOString())
    .lte("connected_at", connectedBefore);
  if (error) throw new Error("Call availability could not be checked.");
  return new Set(data.map((session) => session.user_id)).size === 2;
}

export function canRingCall(
  admin: SupabaseClient,
  call: { caller_id: string; callee_id: string; created_at: string }
) {
  return Date.now() - Date.parse(call.created_at) < STALE_RINGING_MS &&
    bothCallParticipantsOnline(admin, call.caller_id, call.callee_id, call.created_at);
}

export async function expireRingingCall(admin: SupabaseClient, callId: string) {
  const { data, error } = await admin.from("calls")
    .update({ status: "missed", ended_at: new Date().toISOString() })
    .eq("id", callId).eq("status", "ringing")
    .select("room_name").maybeSingle();
  if (error) throw error;
  if (data) await deleteLiveKitRoom(data.room_name);
}

export function generateCallRoomName(): string {
  return `phav-${randomBytes(16).toString("hex")}`;
}

export function extractFirstName(fullName?: string | null): string {
  const trimmed = (fullName || "").trim();
  if (!trimmed) return "Match";
  return trimmed.split(/\s+/)[0] || "Match";
}

export async function endActiveMatchCalls(
  supabaseAdmin: SupabaseClient,
  matchId: string
): Promise<void> {
  const { data: liveCalls } = await supabaseAdmin
    .from("calls")
    .select("id, room_name")
    .eq("match_id", matchId)
    .in("status", ["ringing", "active"]);

  if (!liveCalls || liveCalls.length === 0) return;

  const now = new Date().toISOString();
  await supabaseAdmin
    .from("calls")
    .update({ status: "ended", ended_at: now })
    .eq("match_id", matchId)
    .in("status", ["ringing", "active"]);

  await Promise.all(
    liveCalls.map((row) => deleteLiveKitRoom(row.room_name))
  );
}

export async function handleCallRespondAction(
  request: Request,
  forcedAction?: "accept" | "decline" | "end"
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Missing authorization token." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const callId = typeof body.callId === "string" ? body.callId.trim() : "";
    const action =
      forcedAction ??
      (typeof body.action === "string" ? body.action.trim() : "");

    if (!callId || !ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json(
        { error: "Invalid callId or action." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const {
      data: { user },
      error: verifyError,
    } = await supabaseAdmin.auth.getUser(token);

    if (verifyError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 }
      );
    }

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Verify your email first." },
        { status: 403 }
      );
    }

    const { data: callRow, error: callErr } = await supabaseAdmin
      .from("calls")
      .select("*")
      .eq("id", callId)
      .maybeSingle();

    if (callErr || !callRow) {
      return NextResponse.json({ error: "Call not found." }, { status: 404 });
    }

    if (callRow.caller_id !== user.id && callRow.callee_id !== user.id) {
      return NextResponse.json(
        { error: "You are not a participant of this call." },
        { status: 403 }
      );
    }

    if (action === "accept") {
      if (callRow.callee_id !== user.id) {
        return NextResponse.json(
          { error: "Only the callee can accept a call." },
          { status: 403 }
        );
      }
      if (callRow.status !== "ringing") {
        return NextResponse.json(
          { error: "This call is no longer ringing." },
          { status: 409 }
        );
      }

      const { data: matchRow } = await supabaseAdmin
        .from("matches")
        .select("id, user_a, user_b, closed_at, unmatched_at")
        .eq("id", callRow.match_id)
        .maybeSingle();

      if (!matchRow || matchRow.closed_at || matchRow.unmatched_at) {
        await endActiveMatchCalls(supabaseAdmin, callRow.match_id);
        return NextResponse.json(
          { error: "This match is closed." },
          { status: 409 }
        );
      }

      const partnerId =
        matchRow.user_a === user.id ? matchRow.user_b : matchRow.user_a;

      const { data: blockRows } = await supabaseAdmin
        .from("reports_blocks")
        .select("id")
        .or(
          `and(reporter_id.eq.${user.id},reported_id.eq.${partnerId}),and(reporter_id.eq.${partnerId},reported_id.eq.${user.id})`
        )
        .limit(1);

      if (blockRows && blockRows.length > 0) {
        await endActiveMatchCalls(supabaseAdmin, callRow.match_id);
        return NextResponse.json(
          { error: "Calls are unavailable for blocked accounts." },
          { status: 403 }
        );
      }

      const { data: profileRow } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      const { token: livekitToken, serverUrl } = await createLiveKitToken({
        roomName: callRow.room_name,
        userId: user.id,
        firstName: extractFirstName(profileRow?.full_name),
        callType: callRow.call_type === "video" ? "video" : "audio",
      });

      if (!(await canRingCall(supabaseAdmin, callRow))) {
        await expireRingingCall(supabaseAdmin, callId);
        return NextResponse.json({ error: "This call is no longer ringing." }, { status: 409 });
      }

      const { data: updated, error: updateErr } = await supabaseAdmin
        .from("calls")
        .update({
          status: "active",
          started_at: new Date().toISOString(),
        })
        .eq("id", callId)
        .eq("status", "ringing")
        .select("*")
        .maybeSingle();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
      if (!updated) {
        return NextResponse.json({ error: "This call is no longer ringing." }, { status: 409 });
      }

      return NextResponse.json(
        { call: updated, token: livekitToken, serverUrl },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (action === "decline") {
      if (callRow.callee_id !== user.id) {
        return NextResponse.json(
          { error: "Only the callee can decline a call." },
          { status: 403 }
        );
      }
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from("calls")
        .update({
          status: "declined",
          ended_at: new Date().toISOString(),
        })
        .eq("id", callId)
        .eq("status", "ringing")
        .select("*")
        .maybeSingle();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
      if (!updated) {
        return NextResponse.json({ error: "This call is no longer ringing." }, { status: 409 });
      }

      await deleteLiveKitRoom(callRow.room_name);
      return NextResponse.json({ call: updated });
    }

    // action === "end"
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("calls")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
      })
      .eq("id", callId)
      .select("*")
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    await deleteLiveKitRoom(callRow.room_name);
    return NextResponse.json({ call: updated });
  } catch (err) {
    if (err instanceof LiveKitUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to update call state.",
      },
      { status: 500 }
    );
  }
}
