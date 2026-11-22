"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { normalizePlan, type PlanTier } from "@/lib/entitlements";
import { PLANS } from "@/lib/plans";

const PLAN_RANK: Record<PlanTier, number> = {
  free: 0,
  plus: 1,
  pro: 2,
};

export default function UpgradePage() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanTier>("free");
  const [upgradingTo, setUpgradingTo] = useState<PlanTier | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
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
      .select("plan")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      setErrorMsg(error.message);
    } else if (data) {
      setCurrentPlan(normalizePlan(data.plan));
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPlan();
  }, []);

  async function handleChoosePlan(targetPlan: "plus" | "pro") {
    setErrorMsg(null);
    setSuccessMsg(null);
    setUpgradingTo(targetPlan);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Sign in again to change your plan.");
      }

      const res = await fetch("/api/plan/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: targetPlan }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Could not update your plan.");
      }

      const nextPlan = normalizePlan(body.plan);
      setCurrentPlan(nextPlan);
      setSuccessMsg(
        `You are now on the ${nextPlan === "pro" ? "Pro" : "Plus"} plan.`
      );
      await loadPlan();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Could not update your plan."
      );
    } finally {
      setUpgradingTo(null);
    }
  }

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
              Prototype: no payment is taken.
            </p>
          </div>

          {successMsg && (
            <p
              role="status"
              className="rounded-lg border border-teal bg-teal/15 p-3.5 text-sm font-medium text-dusk"
            >
              {successMsg}
            </p>
          )}

          {errorMsg && (
            <p
              role="alert"
              className="rounded-lg border border-marigold bg-marigold/20 p-3.5 text-sm font-medium text-ink"
            >
              {errorMsg}
            </p>
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
                        <h2 className="text-lg font-bold text-dusk">
                          {plan.name}
                        </h2>
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
                            ? `Updating to ${plan.name}...`
                            : `Choose ${plan.name}`}
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
