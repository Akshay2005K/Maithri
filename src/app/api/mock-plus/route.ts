import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Server-only route for the mock Plus paywall toggle so clients cannot
// self-update is_plus_mock directly via Supabase RLS.
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
        { error: "Verify your email before activating Plus." },
        { status: 403 }
      );
    }

    const { data, error: dbErr } = await supabaseAdmin
      .from("profiles")
      .update({ is_plus_mock: true })
      .eq("id", user.id)
      .select()
      .single();

    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to activate mock Plus.",
      },
      { status: 500 }
    );
  }
}
