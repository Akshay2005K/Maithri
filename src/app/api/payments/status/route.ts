import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  CashfreeSandboxError,
  getCashfreeSandboxConfig,
  verifyAndApplyCashfreeOrder,
} from "@/lib/cashfreeServer";

// Public read-only status check keyed by unguessable 96-bit order_id so
// cross-device QR payments (e.g. phone browser without a session) can display
// the server-verified status without exposing any PII.
export async function GET(request: Request) {
  try {
    getCashfreeSandboxConfig();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id")?.trim() || "";

    if (!orderId || !/^phav_[a-f0-9]{24}$/i.test(orderId)) {
      return NextResponse.json(
        { error: "Invalid order ID." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const result = await verifyAndApplyCashfreeOrder(supabaseAdmin, orderId);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.httpStatus }
      );
    }

    return NextResponse.json(
      {
        status: result.status,
        plan: result.plan,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    if (err instanceof CashfreeSandboxError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Could not check payment status." },
      { status: 500 }
    );
  }
}
