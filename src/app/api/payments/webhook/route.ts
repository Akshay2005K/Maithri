import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  CashfreeSandboxError,
  getCashfreeSandboxConfig,
  verifyAndApplyCashfreeOrder,
  verifyCashfreeWebhookSignature,
} from "@/lib/cashfreeServer";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  try {
    getCashfreeSandboxConfig();

    const rawBody = await request.text();
    const timestamp = request.headers.get("x-webhook-timestamp");
    const signature = request.headers.get("x-webhook-signature");

    if (
      !verifyCashfreeWebhookSignature({
        timestamp,
        signature,
        rawBody,
      })
    ) {
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 401 }
      );
    }

    let payload: { data?: { order?: { order_id?: string } } } = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }

    const orderId =
      typeof payload?.data?.order?.order_id === "string"
        ? payload.data.order.order_id.trim()
        : "";

    if (!orderId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const supabaseAdmin = getSupabaseAdmin();
    await verifyAndApplyCashfreeOrder(supabaseAdmin, orderId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof CashfreeSandboxError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
