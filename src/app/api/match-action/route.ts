import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const ALLOWED_ACTIONS = new Set(["like", "pass", "save", "clear"]);

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

    if (!matchId || !ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json(
        { error: "Invalid matchId or action." },
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

    const { data: matchRow, error: matchErr } = await supabaseAdmin
      .from("matches")
      .select("id, user_a, user_b, action_state")
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

    const currentState =
      matchRow.action_state && typeof matchRow.action_state === "object"
        ? { ...(matchRow.action_state as Record<string, string>) }
        : {};

    if (action === "clear") {
      delete currentState[user.id];
    } else {
      currentState[user.id] = action;
    }

    const { error: updateErr } = await supabaseAdmin
      .from("matches")
      .update({ action_state: currentState })
      .eq("id", matchId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      myAction: action === "clear" ? null : action,
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
