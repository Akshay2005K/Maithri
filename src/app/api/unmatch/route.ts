import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { VALID_CLOSURE_REASON_KEYS } from "@/lib/closureReasons";

// Server-only route delegating to unmatch_match RPC so /api/unmatch and
// /api/match-action share one atomic database mechanism.
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
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!matchId) {
      return NextResponse.json(
        { error: "Missing matchId." },
        { status: 400 }
      );
    }

    if (!VALID_CLOSURE_REASON_KEYS.has(reason)) {
      return NextResponse.json(
        { error: "Select a valid reason before unmatching." },
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
        { error: "Verify your email before managing matches." },
        { status: 403 }
      );
    }

    const { error: rpcErr } = await supabaseAdmin.rpc("unmatch_match", {
      p_match_id: matchId,
      p_user_id: user.id,
      p_reason: reason,
    });

    if (rpcErr) {
      const msg = rpcErr.message;
      const status = msg.includes("NOT_PARTICIPANT")
        ? 403
        : msg.includes("MATCH_NOT_FOUND")
          ? 404
          : msg.includes("ALREADY_CLOSED") ||
              msg.includes("UNMATCH_REQUIRES_MESSAGES")
            ? 409
            : 500;
      return NextResponse.json({ error: msg }, { status });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to unmatch.",
      },
      { status: 500 }
    );
  }
}
