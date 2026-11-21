import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { VALID_CLOSURE_REASON_KEYS } from "@/lib/closureReasons";

const ALLOWED_SET_ACTIONS = new Set([
  "like",
  "pass",
  "save",
  "clear",
  "dismiss_unmatched",
]);

function mapRpcErrorToResponse(message: string) {
  if (message.includes("PASS_HAS_MESSAGES")) {
    return NextResponse.json(
      {
        error:
          "You have a conversation with this person now. Open the chat to unmatch.",
        code: "PASS_HAS_MESSAGES",
      },
      { status: 409 }
    );
  }
  if (message.includes("UNMATCH_REQUIRES_MESSAGES")) {
    return NextResponse.json(
      {
        error: "Cannot unmatch before any messages exist. Use Pass instead.",
        code: "UNMATCH_REQUIRES_MESSAGES",
      },
      { status: 409 }
    );
  }
  if (
    message.includes("ALREADY_CLOSED") ||
    message.includes("MATCH_CLOSED") ||
    message.includes("CANNOT_CLEAR_UNMATCHED") ||
    message.includes("CANNOT_MODIFY_UNMATCHED")
  ) {
    return NextResponse.json({ error: message }, { status: 409 });
  }
  if (message.includes("NOT_PARTICIPANT")) {
    return NextResponse.json(
      { error: "You are not a participant of this match." },
      { status: 403 }
    );
  }
  if (message.includes("MATCH_NOT_FOUND")) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }
  if (message.includes("INVALID_REASON") || message.includes("INVALID_ACTION")) {
    return NextResponse.json({ error: message }, { status: 400 });
  }
  return NextResponse.json({ error: message }, { status: 500 });
}

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
    const action = typeof body.action === "string" ? body.action.trim() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!matchId || (!ALLOWED_SET_ACTIONS.has(action) && action !== "unmatch")) {
      return NextResponse.json(
        { error: "Invalid matchId or action." },
        { status: 400 }
      );
    }

    if (action === "unmatch" && !VALID_CLOSURE_REASON_KEYS.has(reason)) {
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
        { error: "Verify your email first." },
        { status: 403 }
      );
    }

    if (action === "unmatch") {
      const { error: rpcErr } = await supabaseAdmin.rpc("unmatch_match", {
        p_match_id: matchId,
        p_user_id: user.id,
        p_reason: reason,
      });

      if (rpcErr) {
        return mapRpcErrorToResponse(rpcErr.message);
      }

      return NextResponse.json({ ok: true, myAction: "unmatched" });
    }

    const { error: rpcErr } = await supabaseAdmin.rpc("set_match_action", {
      p_match_id: matchId,
      p_user_id: user.id,
      p_action: action,
    });

    if (rpcErr) {
      return mapRpcErrorToResponse(rpcErr.message);
    }

    return NextResponse.json({
      ok: true,
      myAction:
        action === "clear"
          ? null
          : action === "dismiss_unmatched"
            ? "unmatched"
            : action,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to save match action.",
      },
      { status: 500 }
    );
  }
}
