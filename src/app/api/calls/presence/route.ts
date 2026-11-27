import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { canRingCall, expireRingingCall, extractFirstName } from "@/lib/callsServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getModerationStatus } from "@/lib/moderationServer";

const SESSION_ID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
    if (!token) return NextResponse.json({ error: "Sign in again." }, { status: 401 });

    const { sessionId, leaving, selectedCallId } = await request.json().catch(() => ({}));
    if (typeof sessionId !== "string" || !SESSION_ID.test(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user?.email_confirmed_at) {
      return NextResponse.json({ error: "Sign in with a verified email." }, { status: 401 });
    }

    const suspended = (await getModerationStatus(admin, user.id))?.suspended;
    if (suspended && leaving !== true) return NextResponse.json({ call: null });

    const { error } = await admin.rpc("refresh_call_presence", {
      p_user_id: user.id,
      p_session_id: sessionId,
      p_leaving: leaving === true,
    });
    if (error) throw error;

    const { data: pending, error: pendingError } = await admin.from("calls")
      .select("*")
      .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
      .eq("status", "ringing")
      .order("created_at", { ascending: false });
    if (pendingError) throw pendingError;

    const valid = await Promise.all(pending.map(async (call) => {
      if (await canRingCall(admin, call)) return call;
      await expireRingingCall(admin, call.id);
      return null;
    }));

    if (leaving === true) return new NextResponse(null, { status: 204 });

    // Use the user's own read policies for the alert and its caller identity.
    const readable = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
    );
    const ringingIds = valid.flatMap((call) => call?.callee_id === user.id ? [call.id] : []);
    const candidateIds = typeof selectedCallId === "string" && SESSION_ID.test(selectedCallId)
      ? [selectedCallId, ...ringingIds]
      : ringingIds;
    if (candidateIds.length === 0) return NextResponse.json({ call: null });

    const { data: candidates, error: callError } = await readable.from("calls")
      .select("*").eq("callee_id", user.id).in("id", candidateIds).in("status", ["ringing", "active"]);
    if (callError) throw callError;
    const call = candidates.find((row) => row.status === "active" && row.id === selectedCallId)
      ?? ringingIds.map((id) => candidates.find((row) => row.id === id && row.status === "ringing")).find(Boolean);
    if (!call) return NextResponse.json({ call: null });

    const { data: profile } = await admin.from("profiles")
      .select("full_name").eq("id", call.caller_id).maybeSingle();
    return NextResponse.json({ call, callerName: extractFirstName(profile?.full_name) });
  } catch {
    return NextResponse.json({ error: "Call availability could not be checked." }, { status: 503 });
  }
}
