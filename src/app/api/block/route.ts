import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { endActiveMatchCalls } from "@/lib/callsServer";

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
    const reportedId =
      typeof body.reportedId === "string" ? body.reportedId.trim() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const matchId =
      typeof body.matchId === "string" ? body.matchId.trim() : "";

    if (!reportedId || !reason) {
      return NextResponse.json(
        { error: "Missing reportedId or reason." },
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

    const { error: blockErr } = await supabaseAdmin
      .from("reports_blocks")
      .insert({
        reporter_id: user.id,
        reported_id: reportedId,
        reason,
      });

    if (blockErr) {
      return NextResponse.json({ error: blockErr.message }, { status: 500 });
    }

    if (matchId) {
      await endActiveMatchCalls(supabaseAdmin, matchId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to block user." },
      { status: 500 }
    );
  }
}
