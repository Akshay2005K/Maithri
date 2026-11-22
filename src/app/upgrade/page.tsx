"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getEffectivePlan, type PlanTier } from "@/lib/entitlements";
import { PLANS } from "@/lib/plans";
import { CASHFREE_TEST_DATA } from "@/lib/cashfreeTestData";

const PLAN_RANK: Record<PlanTier, number> = {
  free: 0,
  plus: 1,
  pro: 2,
};

declare global {
  interface Window {
    Cashfree?: (opts: { mode: "sandbox" | "production" }) => {
      checkout: (opts: {
        paymentSessionId: string;
        redirectTarget?: "_self" | "_modal" | "_blank";
      }) => Promise<{
        error?: { message?: string };
        redirect?: boolean;
        paymentDetails?: { paymentMessage?: string };
      }>;
    };
  }
}

function loadCashfreeSdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Checkout requires a browser."));
  }
  if (window.Cashfree) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Could not load Cashfree checkout SDK."))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Could not load Cashfree checkout SDK."));
    document.head.appendChild(script);
  });
}

function formatExpiryDate(iso?: string | null): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms) || ms <= Date.now()) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(ms));
}

export default function UpgradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanTier>("free");
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [upgradingTo, setUpgradingTo] = useState<PlanTier | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function loadPlan() {
    setLoading(true);
    setErrorMsg(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setSignedIn(false);
      setLoading(false);
      return;
    }

    setSignedIn(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("plan, plan_expires_at")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      setErrorMsg(error.message);
    } else if (data) {
      setCurrentPlan(getEffectivePlan(data.plan, data.plan_expires_at));
      setPlanExpiresAt(data.plan_expires_at ?? null);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPlan();
  }, []);

  async function handleChoosePlan(targetPlan: "plus" | "pro") {
    setErrorMsg(null);

    if (process.env.NEXT_PUBLIC_CASHFREE_MODE?.trim() !== "sandbox") {
      setErrorMsg("Payments are available in sandbox test mode only.");
      return;
    }

    setUpgradingTo(targetPlan);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Sign in again to continue to checkout.");
      }

      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: targetPlan }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.paymentSessionId || !body.orderId) {
        throw new Error(body.error || "Could not start sandbox checkout.");
      }

      await loadCashfreeSdk();
      if (!window.Cashfree) {
        throw new Error("Cashfree checkout SDK failed to initialize.");
      }

      const cashfree = window.Cashfree({ mode: "sandbox" });
      const result = await cashfree.checkout({
        paymentSessionId: body.paymentSessionId,
        redirectTarget: "_modal",
      });

      if (result.error) {
        throw new Error(
          result.error.message || "Checkout closed or failed. Try again."
        );
      }

      if (result.paymentDetails || !result.redirect) {
        router.push(
          `/upgrade/result?order_id=${encodeURIComponent(body.orderId)}`
        );
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Could not start checkout."
      );
      setUpgradingTo(null);
    }
  }

  const formattedExpiry = formatExpiryDate(planExpiresAt);

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

      <main className="mx-auto w-full max-w-[1100px] px-4 py-8 text-left sm:px-6">
        <div className="space-y-6">
          <div className="border-b border-dusk/15 pb-4">
            <h1 className="text-2xl font-bold text-dusk">Plans</h1>
            <p className="mt-1 text-sm text-ink/80">
              Choose the plan that fits how you connect on pHavelength.
            </p>
            <p className="mt-2 inline-block rounded border border-marigold bg-marigold/15 px-3 py-1 text-xs font-medium text-ink">
              Test mode: no real money is charged.
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-marigold bg-marigold/20 p-3.5 text-sm font-medium text-ink"
            >
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="inline-flex min-h-[36px] items-center rounded border border-dusk/25 bg-fog px-3 text-xs font-medium text-dusk hover:bg-dusk/10"
              >
                Dismiss
              </button>
            </div>
          )}

          {!loading && !signedIn && (
            <div className="rounded-lg border border-dusk/20 bg-fog p-4 text-sm text-ink/85">
              Sign in on the{" "}
              <Link
                href="/"
                className="font-medium text-dusk underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk"
              >
                home page
              </Link>{" "}
              to view or upgrade your plan.
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className="h-56 animate-pulse rounded-lg border border-dusk/15 bg-dusk/5 p-6 motion-reduce:animate-none"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {PLANS.map((plan) => {
                const isCurrent = signedIn && plan.id === currentPlan;
                const isHigher =
                  signedIn && PLAN_RANK[plan.id] > PLAN_RANK[currentPlan];
                const isUpdatingThis = upgradingTo === plan.id;

                return (
                  <article
                    key={plan.id}
                    className={`flex flex-col justify-between rounded-lg p-6 ${
                      isCurrent
                        ? "border-2 border-dusk bg-dusk/5"
                        : "border border-dusk/20 bg-fog"
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="text-lg font-bold text-dusk">
                            {plan.name}
                          </h2>
                          {isCurrent && formattedExpiry && (
                            <span className="rounded-full border border-teal/50 bg-teal/15 px-2.5 py-0.5 text-[11px] font-semibold text-dusk">
                              {plan.name} until {formattedExpiry}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-ink/80">
                          {plan.description}
                        </p>
                      </div>

                      <p className="text-2xl font-bold text-dusk">
                        ₹{plan.monthlyPriceInr}{" "}
                        <span className="text-sm font-normal text-ink/75">
                          per month
                        </span>
                      </p>

                      {plan.features.length === 0 ? (
                        <p className="text-xs text-ink/60">
                          Plan details coming soon
                        </p>
                      ) : (
                        <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink/85">
                          {plan.features.map((feat) => (
                            <li key={feat}>{feat}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="mt-6">
                      {isCurrent ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex min-h-[44px] w-full cursor-not-allowed items-center justify-center rounded border border-dusk/30 bg-dusk/10 px-4 text-sm font-medium text-dusk opacity-80"
                        >
                          Your current plan
                        </button>
                      ) : isHigher &&
                        (plan.id === "plus" || plan.id === "pro") ? (
                        <button
                          type="button"
                          disabled={upgradingTo !== null}
                          onClick={() =>
                            handleChoosePlan(plan.id as "plus" | "pro")
                          }
                          className="inline-flex min-h-[44px] w-full items-center justify-center rounded bg-dusk px-4 text-sm font-medium text-fog transition-colors hover:bg-dusk/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2 disabled:opacity-50 motion-reduce:transition-none"
                        >
                          {isUpdatingThis
                            ? "Opening sandbox checkout..."
                            : `Choose ${plan.name}`}
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* How to test box (Sandbox test credentials) */}
          <aside className="space-y-2 rounded-lg border border-dusk/20 bg-dusk/5 p-5 text-xs leading-relaxed text-ink/85">
            <h2 className="text-sm font-semibold text-dusk">
              How to test (Cashfree Sandbox)
            </h2>
            <p>
              <strong>Test mode: no real money is charged.</strong> Use these
              details from {CASHFREE_TEST_DATA.sourceLabel} inside the Cashfree
              checkout popup:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Test Visa card:</strong>{" "}
                <code>{CASHFREE_TEST_DATA.card.visaNumber}</code> | Expiry:{" "}
                <code>{CASHFREE_TEST_DATA.card.expiry}</code> | CVV:{" "}
                <code>{CASHFREE_TEST_DATA.card.cvv}</code> | Name:{" "}
                <code>{CASHFREE_TEST_DATA.card.name}</code> | OTP:{" "}
                <code>{CASHFREE_TEST_DATA.card.otp}</code>
              </li>
              <li>
                <strong>Test UPI VPA (success):</strong>{" "}
                <code>{CASHFREE_TEST_DATA.upi.successVpa}</code> (or{" "}
                <code>{CASHFREE_TEST_DATA.upi.failedVpa}</code> to test failure)
              </li>
            </ul>
          </aside>
        </div>
      </main>
    </>
  );
}
