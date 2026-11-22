import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizePlan, type PlanTier } from "@/lib/entitlements";

const PLAN_RANK: Record<PlanTier, number> = {
  free: 0,
  plus: 1,
  pro: 2,
};

// Mock plan upgrade endpoint: no payment is collected in this prototype.
// Only upward transitions (free -> plus|pro, plus -> pro) are permitted.
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
    const targetPlan: "plus" | "pro" | null =
      body.plan === "plus" || body.plan === "pro" ? body.plan : null;

    if (!targetPlan) {
      return NextResponse.json(
        { error: "Invalid plan. Choose 'plus' or 'pro'." },
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
        { error: "Verify your email before upgrading your plan." },
        { status: 403 }
      );
    }

    const { data: currentProfile, error: fetchErr } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchErr || !currentProfile) {
      return NextResponse.json(
        { error: "Complete onboarding before upgrading your plan." },
        { status: 404 }
      );
    }

    const currentPlan = normalizePlan(currentProfile.plan);
    if (PLAN_RANK[targetPlan] <= PLAN_RANK[currentPlan]) {
      return NextResponse.json(
        {
          error:
            currentPlan === targetPlan
              ? `You are already on the ${currentPlan} plan.`
              : "Downgrades are not supported.",
        },
        { status: 409 }
      );
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({ plan: targetPlan })
      .eq("id", user.id)
      .select("plan")
      .single();

    if (updateErr || !updated) {
      return NextResponse.json(
        { error: updateErr?.message || "Failed to update plan." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { plan: normalizePlan(updated.plan) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to upgrade plan.",
      },
      { status: 500 }
    );
  }
}
