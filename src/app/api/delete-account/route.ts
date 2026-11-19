import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Server-only API route to permanently delete the authenticated user.
// Uses SUPABASE_SERVICE_ROLE_KEY because deleting a row from auth.users
// requires admin privileges that must never exist in browser code.
// ON DELETE CASCADE on profiles -> matches -> messages -> reports_blocks cleans up all user rows.
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

    // Verify the caller's JWT on the server instead of trusting any client-sent user ID
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

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id
    );

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to delete account.",
      },
      { status: 500 }
    );
  }
}
