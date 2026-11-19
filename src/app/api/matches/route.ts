import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getOrCreateTodaysMatchesForUser } from "@/lib/matching";
import type { Profile } from "@/lib/supabase";

// Server-only route for generating and fetching today's curated matches.
// Enforces the 3/day cap, Privacy Shield, blocks, and returns only SafePartnerProfile fields.
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

    const { data: myProfile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr || !myProfile) {
      return NextResponse.json(
        { error: "Profile not found. Complete onboarding first." },
        { status: 404 }
      );
    }

    const result = await getOrCreateTodaysMatchesForUser(
      myProfile as Profile,
      supabaseAdmin
    );

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to load matches.",
      },
      { status: 500 }
    );
  }
}
