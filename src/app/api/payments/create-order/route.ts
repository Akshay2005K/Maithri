import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getEffectivePlan, type PlanTier } from "@/lib/entitlements";
import { PLANS } from "@/lib/plans";
import {
  CashfreeSandboxError,
  createCashfreeSandboxOrder,
  getCashfreeSandboxConfig,
} from "@/lib/cashfreeServer";

const PLAN_RANK: Record<PlanTier, number> = {
  free: 0,
  plus: 1,
  pro: 2,
};

const MAX_ORDERS_PER_HOUR = 10;

export async function POST(request: Request) {
  try {
    // Enforce sandbox guard before doing anything else
    getCashfreeSandboxConfig();

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

    const planConfig = PLANS.find((p) => p.id === targetPlan);
    if (!planConfig || planConfig.monthlyPriceInr <= 0) {
      return NextResponse.json(
        { error: "Selected plan is not purchasable." },
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

    if (!user.email_confirmed_at || !user.email) {
      return NextResponse.json(
        { error: "Verify your email before upgrading your plan." },
        { status: 403 }
      );
    }

    const { data: profileRow, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("plan, plan_expires_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr || !profileRow) {
      return NextResponse.json(
        { error: "Complete onboarding before upgrading your plan." },
        { status: 404 }
      );
    }

    const effectivePlan = getEffectivePlan(
      profileRow.plan,
      profileRow.plan_expires_at
    );

    // Reject downgrades (e.g. Pro -> Plus); allow upgrades and same-plan renewals
    if (PLAN_RANK[targetPlan] < PLAN_RANK[effectivePlan]) {
      return NextResponse.json(
        { error: "Downgrades are not supported." },
        { status: 409 }
      );
    }

    // Rate limit: 10 order creations per user per hour
    const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
    const { count: recentOrders, error: rateErr } = await supabaseAdmin
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", oneHourAgo);

    if (!rateErr && (recentOrders ?? 0) >= MAX_ORDERS_PER_HOUR) {
      return NextResponse.json(
        { error: "Too many payment attempts. Please wait and try again." },
        { status: 429 }
      );
    }

    const orderId = `phav_${randomBytes(12).toString("hex")}`;
    const origin =
      request.headers.get("origin") || new URL(request.url).origin;
    const returnUrl = `${origin}/upgrade/result?order_id=${encodeURIComponent(
      orderId
    )}`;

    const cfOrder = await createCashfreeSandboxOrder({
      orderId,
      amountInr: planConfig.monthlyPriceInr,
      userId: user.id,
      email: user.email,
      returnUrl,
    });

    const { error: insertErr } = await supabaseAdmin.from("payments").insert({
      user_id: user.id,
      plan: targetPlan,
      amount_inr: planConfig.monthlyPriceInr,
      currency: "INR",
      cashfree_order_id: orderId,
      status: "created",
    });

    if (insertErr) {
      return NextResponse.json(
        { error: "Failed to record payment order." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        orderId: cfOrder.orderId,
        paymentSessionId: cfOrder.paymentSessionId,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    if (err instanceof CashfreeSandboxError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to create order.",
      },
      { status: 500 }
    );
  }
}
