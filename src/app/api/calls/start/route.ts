import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getUnblurStatus } from "@/lib/unblur";
import { canStartCall, getRequiredPlanForCall } from "@/lib/entitlements";
import {
  createLiveKitRoom,
  createLiveKitToken,
  getLiveKitServerUrl,
  LiveKitUnavailableError,
} from "@/lib/livekitServer";
import {
  extractFirstName,
  generateCallRoomName,
} from "@/lib/callsServer";

const MAX_CALL_STARTS_PER_HOUR = 10;
const STALE_RINGING_MS = 60_000;

export async function POST(request: Request) {
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
    const matchId = typeof body.matchId === "string" ? body.matchId.trim() : "";
    const callType =
      body.callType === "audio" || body.callType === "video"
        ? body.callType
        : null;

    if (!matchId || !callType) {
      return NextResponse.json(
        { error: "Invalid matchId or callType." },
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
        { error: "Verify your email before starting a call." },
        { status: 403 }
      );
    }

    const { data: matchRow, error: matchErr } = await supabaseAdmin
      .from("matches")
      .select("id, user_a, user_b, closed_at, unmatched_at, action_state")
      .eq("id", matchId)
      .maybeSingle();

    if (matchErr || !matchRow) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    if (matchRow.user_a !== user.id && matchRow.user_b !== user.id) {
      return NextResponse.json(
        { error: "You are not a participant of this match." },
        { status: 403 }
      );
    }

    if (matchRow.closed_at || matchRow.unmatched_at) {
      return NextResponse.json(
        { error: "This match is closed." },
        { status: 409 }
      );
    }

    const partnerId =
      matchRow.user_a === user.id ? matchRow.user_b : matchRow.user_a;

    // Check bidirectional blocks
    const { data: blockRows } = await supabaseAdmin
      .from("reports_blocks")
      .select("id")
      .or(
        `and(reporter_id.eq.${user.id},reported_id.eq.${partnerId}),and(reporter_id.eq.${partnerId},reported_id.eq.${user.id})`
      )
      .limit(1);

    if (blockRows && blockRows.length > 0) {
      return NextResponse.json(
        { error: "Calls are unavailable for blocked accounts." },
        { status: 403 }
      );
    }

    // Plan check comes first (computed from DB, never from request body)
    const { data: profileRow } = await supabaseAdmin
      .from("profiles")
      .select("full_name, plan")
      .eq("id", user.id)
      .maybeSingle();

    if (!canStartCall(profileRow?.plan, callType)) {
      const requiredPlan = getRequiredPlanForCall(callType);
      return NextResponse.json(
        {
          code: "upgrade_required",
          required_plan: requiredPlan,
          error:
            requiredPlan === "pro"
              ? "Video calls are part of Pro."
              : "Voice calls are part of Plus and Pro.",
        },
        { status: 403 }
      );
    }

    // Server-side unblur gating: audio requires level >= 2, video requires level 3
    const { data: msgs } = await supabaseAdmin
      .from("messages")
      .select("sender_id, content")
      .eq("match_id", matchId);

    const unblur = getUnblurStatus(msgs ?? []);
    if (callType === "audio" && unblur.level < 2) {
      return NextResponse.json(
        {
          code: "not_unlocked_yet",
          required_level: 2,
          error:
            "Voice calls unlock at Level 2 after mutual conversation progress.",
        },
        { status: 403 }
      );
    }
    if (callType === "video" && unblur.level < 3) {
      return NextResponse.json(
        {
          code: "not_unlocked_yet",
          required_level: 3,
          error:
            "Video calls unlock at Level 3 after 3+ valid messages from both sides.",
        },
        { status: 403 }
      );
    }

    // Rate limit: 10 call starts per user per hour
    const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
    const { count: recentCallCount, error: rateErr } = await supabaseAdmin
      .from("calls")
      .select("id", { count: "exact", head: true })
      .eq("caller_id", user.id)
      .gte("created_at", oneHourAgo);

    if (!rateErr && (recentCallCount ?? 0) >= MAX_CALL_STARTS_PER_HOUR) {
      return NextResponse.json(
        { error: "You have reached the hourly limit of 10 call starts." },
        { status: 429 }
      );
    }

    // Mark stale ringing calls (> 60s) as missed, then enforce one live call per match
    const staleCutoff = new Date(Date.now() - STALE_RINGING_MS).toISOString();
    await supabaseAdmin
      .from("calls")
      .update({ status: "missed", ended_at: new Date().toISOString() })
      .eq("match_id", matchId)
      .eq("status", "ringing")
      .lt("created_at", staleCutoff);

    const { data: liveCalls } = await supabaseAdmin
      .from("calls")
      .select("id")
      .eq("match_id", matchId)
      .in("status", ["ringing", "active"])
      .limit(1);

    if (liveCalls && liveCalls.length > 0) {
      return NextResponse.json(
        { error: "A call is already in progress for this match." },
        { status: 409 }
      );
    }

    const roomName = generateCallRoomName();
    const serverUrl = getLiveKitServerUrl();

    await createLiveKitRoom(roomName);
    const { token: livekitToken } = await createLiveKitToken({
      roomName,
      userId: user.id,
      firstName: extractFirstName(profileRow?.full_name),
      callType,
    });

    const { data: callRow, error: insertErr } = await supabaseAdmin
      .from("calls")
      .insert({
        match_id: matchId,
        caller_id: user.id,
        callee_id: partnerId,
        call_type: callType,
        status: "ringing",
        room_name: roomName,
        room_url: serverUrl,
      })
      .select("*")
      .single();

    if (insertErr || !callRow) {
      return NextResponse.json(
        { error: insertErr?.message || "Failed to save call." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { call: callRow, token: livekitToken, serverUrl },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    if (err instanceof LiveKitUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to start call.",
      },
      { status: 500 }
    );
  }
}
