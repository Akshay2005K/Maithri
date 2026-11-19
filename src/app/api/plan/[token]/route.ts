import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function firstNameOf(fullName: string | null | undefined): string {
  const cleaned = (fullName ?? "").trim();
  if (!cleaned) return "Friend";
  return cleaned.split(/\s+/)[0];
}

// Server-only route for /plan/[token]. Uses SUPABASE_SERVICE_ROLE_KEY so an
// unauthenticated friend with the share link can read ONLY the four allowed
// meetup fields without exposing profiles, photos, or match history.
export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const cleanedToken = (token ?? "").trim();

    if (!cleanedToken || !/^[a-f0-9]{32,}$/i.test(cleanedToken)) {
      return NextResponse.json(
        { error: "This plan link has expired or doesn't exist." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: plan, error: planErr } = await supabaseAdmin
      .from("date_plans")
      .select("place_name, plan_time, expires_at, created_by, match_id")
      .eq("share_token", cleanedToken)
      .maybeSingle();

    if (
      planErr ||
      !plan ||
      new Date(plan.expires_at).getTime() <= Date.now()
    ) {
      return NextResponse.json(
        { error: "This plan link has expired or doesn't exist." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const { data: matchRow } = await supabaseAdmin
      .from("matches")
      .select("user_a, user_b")
      .eq("id", plan.match_id)
      .maybeSingle();

    if (!matchRow) {
      return NextResponse.json(
        { error: "This plan link has expired or doesn't exist." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const partnerId =
      matchRow.user_a === plan.created_by ? matchRow.user_b : matchRow.user_a;

    const { data: people } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", [plan.created_by, partnerId]);

    const creator = people?.find((p) => p.id === plan.created_by);
    const partner = people?.find((p) => p.id === partnerId);

    return NextResponse.json(
      {
        creatorFirstName: firstNameOf(creator?.full_name),
        partnerFirstName: firstNameOf(partner?.full_name),
        placeName: plan.place_name,
        planTime: plan.plan_time,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "This plan link has expired or doesn't exist." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
