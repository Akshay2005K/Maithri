import { createHmac, timingSafeEqual } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export class CashfreeSandboxError extends Error {
  status: number;
  constructor(message: string, status = 503) {
    super(message);
    this.name = "CashfreeSandboxError";
    this.status = status;
  }
}

const CASHFREE_SANDBOX_BASE_URL = "https://sandbox.cashfree.com/pg";
const CASHFREE_API_VERSION = "2025-01-01";
export const SANDBOX_DUMMY_PHONE = "9999999999";

export function getCashfreeSandboxConfig(): {
  appId: string;
  secretKey: string;
  baseUrl: string;
  apiVersion: string;
} {
  const env = process.env.CASHFREE_ENV?.trim();
  const appId = process.env.CASHFREE_APP_ID?.trim() || "";
  const secretKey = process.env.CASHFREE_SECRET_KEY?.trim() || "";

  if (env !== "sandbox" || !appId.startsWith("TEST_") || !secretKey) {
    throw new CashfreeSandboxError(
      "Payments are available in sandbox test mode only.",
      503
    );
  }

  return {
    appId,
    secretKey,
    baseUrl: CASHFREE_SANDBOX_BASE_URL,
    apiVersion: CASHFREE_API_VERSION,
  };
}

export interface CashfreeOrderResponse {
  cf_order_id?: string | number;
  order_id: string;
  order_status: string;
  order_amount: number;
  order_currency: string;
  payment_session_id?: string;
}

export async function createCashfreeSandboxOrder(params: {
  orderId: string;
  amountInr: number;
  userId: string;
  email: string;
  returnUrl: string;
}): Promise<{ orderId: string; paymentSessionId: string }> {
  const { appId, secretKey, baseUrl, apiVersion } = getCashfreeSandboxConfig();

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-version": apiVersion,
        "x-client-id": appId,
        "x-client-secret": secretKey,
      },
      body: JSON.stringify({
        order_id: params.orderId,
        order_amount: params.amountInr,
        order_currency: "INR",
        customer_details: {
          customer_id: params.userId,
          customer_email: params.email,
          customer_phone: SANDBOX_DUMMY_PHONE,
        },
        order_meta: {
          return_url: params.returnUrl,
        },
      }),
    });
  } catch {
    throw new CashfreeSandboxError(
      "Payment gateway is temporarily unreachable. Please try again.",
      503
    );
  }

  const data = (await res.json().catch(() => ({}))) as CashfreeOrderResponse & {
    message?: string;
  };

  if (!res.ok || !data.payment_session_id) {
    throw new CashfreeSandboxError(
      data.message || "Could not create sandbox payment order.",
      503
    );
  }

  return {
    orderId: data.order_id || params.orderId,
    paymentSessionId: data.payment_session_id,
  };
}

export async function fetchCashfreeSandboxOrder(
  orderId: string
): Promise<CashfreeOrderResponse> {
  const { appId, secretKey, baseUrl, apiVersion } = getCashfreeSandboxConfig();

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-api-version": apiVersion,
        "x-client-id": appId,
        "x-client-secret": secretKey,
      },
      cache: "no-store",
    });
  } catch {
    throw new CashfreeSandboxError(
      "Payment gateway is temporarily unreachable. Please try again.",
      503
    );
  }

  const data = (await res.json().catch(() => ({}))) as CashfreeOrderResponse & {
    message?: string;
  };

  if (!res.ok || !data.order_id) {
    throw new CashfreeSandboxError(
      data.message || "Could not verify payment order with Cashfree.",
      503
    );
  }

  return data;
}

export type VerifyOrderResult =
  | {
      ok: true;
      status: "paid" | "pending" | "failed" | "expired";
      plan: "plus" | "pro";
      planExpiresAt?: string | null;
    }
  | {
      ok: false;
      httpStatus: number;
      error: string;
    };

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function verifyAndApplyCashfreeOrder(
  supabaseAdmin: SupabaseClient,
  orderId: string,
  expectedUserId?: string
): Promise<VerifyOrderResult> {
  // Ensure sandbox guard runs before any verification
  getCashfreeSandboxConfig();

  const { data: paymentRow, error: payErr } = await supabaseAdmin
    .from("payments")
    .select("id, user_id, plan, amount_inr, currency, status")
    .eq("cashfree_order_id", orderId)
    .maybeSingle();

  if (payErr || !paymentRow) {
    return { ok: false, httpStatus: 404, error: "Order not found." };
  }

  if (expectedUserId && paymentRow.user_id !== expectedUserId) {
    return {
      ok: false,
      httpStatus: 403,
      error: "This order does not belong to your account.",
    };
  }

  const purchasedPlan: "plus" | "pro" =
    paymentRow.plan === "pro" ? "pro" : "plus";

  if (paymentRow.status === "paid") {
    return { ok: true, status: "paid", plan: purchasedPlan };
  }
  if (paymentRow.status === "failed" || paymentRow.status === "expired") {
    return { ok: true, status: paymentRow.status, plan: purchasedPlan };
  }

  const cfOrder = await fetchCashfreeSandboxOrder(orderId);

  if (cfOrder.order_status === "PAID") {
    if (
      Number(cfOrder.order_amount) !== Number(paymentRow.amount_inr) ||
      cfOrder.order_currency !== "INR" ||
      paymentRow.currency !== "INR"
    ) {
      return {
        ok: false,
        httpStatus: 409,
        error: "Payment amount or currency did not match the order.",
      };
    }

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();

    // Atomic conditional update: only one caller can transition 'created' -> 'paid'
    const { data: claimed, error: claimErr } = await supabaseAdmin
      .from("payments")
      .update({ status: "paid", paid_at: nowIso })
      .eq("id", paymentRow.id)
      .eq("status", "created")
      .select("id, user_id, plan")
      .maybeSingle();

    if (claimErr) {
      return {
        ok: false,
        httpStatus: 500,
        error: "Could not record payment confirmation.",
      };
    }

    if (!claimed) {
      // Already claimed by a concurrent verify/webhook call; never extend twice
      return { ok: true, status: "paid", plan: purchasedPlan };
    }

    const { data: profileRow } = await supabaseAdmin
      .from("profiles")
      .select("plan, plan_expires_at")
      .eq("id", claimed.user_id)
      .maybeSingle();

    const currentExpiryMs = profileRow?.plan_expires_at
      ? Date.parse(profileRow.plan_expires_at)
      : NaN;
    const isRenewingSamePlan =
      profileRow?.plan === purchasedPlan &&
      !Number.isNaN(currentExpiryMs) &&
      currentExpiryMs > nowMs;

    const baseMs = isRenewingSamePlan ? currentExpiryMs : nowMs;
    const nextExpiresAt = new Date(baseMs + THIRTY_DAYS_MS).toISOString();

    const { error: profileUpdateErr } = await supabaseAdmin
      .from("profiles")
      .update({
        plan: purchasedPlan,
        plan_expires_at: nextExpiresAt,
      })
      .eq("id", claimed.user_id);

    if (profileUpdateErr) {
      return {
        ok: false,
        httpStatus: 500,
        error: "Payment recorded, but failed to activate plan.",
      };
    }

    return {
      ok: true,
      status: "paid",
      plan: purchasedPlan,
      planExpiresAt: nextExpiresAt,
    };
  }

  if (
    cfOrder.order_status === "EXPIRED" ||
    cfOrder.order_status === "TERMINATED" ||
    cfOrder.order_status === "TERMINATION_REQUESTED"
  ) {
    const nextStatus: "expired" | "failed" =
      cfOrder.order_status === "EXPIRED" ? "expired" : "failed";

    await supabaseAdmin
      .from("payments")
      .update({ status: nextStatus })
      .eq("id", paymentRow.id)
      .eq("status", "created");

    return { ok: true, status: nextStatus, plan: purchasedPlan };
  }

  return { ok: true, status: "pending", plan: purchasedPlan };
}

export function verifyCashfreeWebhookSignature(params: {
  timestamp: string | null;
  signature: string | null;
  rawBody: string;
}): boolean {
  const { timestamp, signature, rawBody } = params;
  if (!timestamp || !signature || !rawBody) return false;

  const { secretKey } = getCashfreeSandboxConfig();
  const signedPayload = `${timestamp}${rawBody}`;
  const expected = createHmac("sha256", secretKey)
    .update(signedPayload)
    .digest("base64");

  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== actualBuf.length) return false;

  return timingSafeEqual(expectedBuf, actualBuf);
}
