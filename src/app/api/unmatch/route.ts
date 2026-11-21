import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Server-only route to unmatch without filing a report.
// Verifies the caller's JWT and confirms they are user_a or user_b on the match.
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
    if (!matchId) {
      return NextResponse.json(
        { error: "Missing matchId." },
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

    const { data: matchRow, error: matchErr } = await supabaseAdmin
      .from("matches")
      .select("id, user_a, user_b")
      .eq("id", matchId)
      .maybeSingle();

    if (matchErr || !matchRow) {
      return NextResponse.json(
        { error: "Match not found." },
        { status: 404 }
      );
    }

    if (matchRow.user_a !== user.id && matchRow.user_b !== user.id) {
      return NextResponse.json(
        { error: "You are not a participant of this match." },
        { status: 403 }
      );
    }

    // Soft-unmatch: mark the match as unmatched so it disappears for both users
    // and is never re-matched in future daily runs.
    const { error: updateErr } = await supabaseAdmin
      .from("matches")
      .update({
        unmatched_at: new Date().toISOString(),
        unmatched_by: user.id,
      })
      .eq("id", matchId);

    if (updateErr) {
      return NextResponse.json(
        { error: updateErr.message },
        { status: 500 }
      );
    }

    // Remove any active Share Date links for this match
    await supabaseAdmin.from("date_plans").delete().eq("match_id", matchId);

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
