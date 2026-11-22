"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";

type VerifyState =
  | "verifying"
  | "paid"
  | "pending"
  | "failed"
  | "expired"
  | "error";

function UpgradeResultContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id")?.trim() || "";

  const [state, setState] = useState<VerifyState>(
    orderId ? "verifying" : "error"
  );
  const [message, setMessage] = useState<string>(
    orderId ? "Checking your payment status with Cashfree..." : "Missing order ID."
  );
  const [planName, setPlanName] = useState<string | null>(null);
  const [retries, setRetries] = useState(0);

  async function verifyOrder() {
    if (!orderId) {
      setState("error");
      setMessage("Missing order ID in URL.");
      return;
    }

    setState("verifying");
    setMessage("Checking your payment status with Cashfree...");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setState("error");
        setMessage("Sign in again to verify your payment.");
        return;
      }

      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("error");
        setMessage(body.error || "Could not verify payment.");
        return;
      }

      if (body.status === "paid") {
        setState("paid");
        setPlanName(body.plan === "pro" ? "Pro" : "Plus");
        setMessage(
          `Payment confirmed. Your ${body.plan === "pro" ? "Pro" : "Plus"} plan is active.`
        );
      } else if (body.status === "failed") {
        setState("failed");
        setMessage("Payment was not completed or failed. No plan change was made.");
      } else if (body.status === "expired") {
        setState("expired");
        setMessage("This payment order expired. Please start a new checkout.");
      } else {
        setState("pending");
        setMessage("Payment is still pending confirmation from Cashfree.");
      }
    } catch {
      setState("error");
      setMessage("Could not reach the verification server. Please try again.");
    }
  }

  useEffect(() => {
    verifyOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    if (state !== "pending" || retries >= 3) return;
    const timer = setTimeout(() => {
      setRetries((prev) => prev + 1);
      verifyOrder();
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, retries]);

  return (
    <div className="mx-auto max-w-lg space-y-5 rounded-lg border border-dusk/20 bg-fog p-6">
      <p className="inline-block rounded border border-marigold bg-marigold/15 px-3 py-1 text-xs font-medium text-ink">
        Test mode: no real money is charged.
      </p>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-dusk">
          {state === "paid"
            ? `${planName ?? "Plan"} unlocked`
            : state === "verifying" || state === "pending"
              ? "Payment verification"
              : "Payment not completed"}
        </h1>
        <p className="text-sm leading-relaxed text-ink/85">{message}</p>
        {orderId && (
          <p className="text-xs text-ink/60">Order reference: {orderId}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        {state === "paid" ? (
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center rounded bg-dusk px-5 text-sm font-medium text-fog transition-colors hover:bg-dusk/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Back to matches
          </Link>
        ) : (
          <>
            {(state === "pending" || state === "error") && (
              <button
                type="button"
                onClick={verifyOrder}
                className="inline-flex min-h-[44px] items-center justify-center rounded bg-dusk px-5 text-sm font-medium text-fog transition-colors hover:bg-dusk/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2 motion-reduce:transition-none"
              >
                Check again
              </button>
            )}
            <Link
              href="/upgrade"
              className="inline-flex min-h-[44px] items-center justify-center rounded border border-dusk/25 bg-fog px-5 text-sm font-medium text-dusk transition-colors hover:bg-dusk/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              Back to plans
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function UpgradeResultPage() {
  return (
    <>
      <header className="border-b border-dusk/15 bg-fog">
        <div className="mx-auto flex min-h-[64px] w-full max-w-[1100px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex min-h-[44px] flex-col items-start justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2"
          >
            <span className="text-xl font-bold tracking-tight text-dusk">
              pHavelength
            </span>
            <span className="text-xs text-ink/75">
              Simulated eLitmus verification (prototype)
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded border border-dusk/25 bg-fog px-4 text-sm font-medium text-dusk transition-colors hover:bg-dusk/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1100px] px-4 py-10 text-left sm:px-6">
        <Suspense
          fallback={
            <div className="mx-auto max-w-lg rounded-lg border border-dusk/20 bg-fog p-6 text-sm text-ink/80">
              Verifying your payment...
            </div>
          }
        >
          <UpgradeResultContent />
        </Suspense>
      </main>
    </>
  );
}
