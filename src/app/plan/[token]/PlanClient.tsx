"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PublicPlanData {
  creatorFirstName: string;
  partnerFirstName: string;
  placeName: string;
  planTime: string;
}

export default function PlanClient({ token }: { token: string }) {
  const [plan, setPlan] = useState<PublicPlanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadPlan() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/plan/${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        const body = await res.json().catch(() => ({}));
        if (!active) return;

        if (!res.ok) {
          setError(
            body.error || "This plan link has expired or doesn't exist."
          );
        } else {
          setPlan(body as PublicPlanData);
        }
      } catch {
        if (!active) return;
        setError("This plan link has expired or doesn't exist.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadPlan();
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <>
      <header className="border-b border-dusk/15 bg-fog">
        <div className="mx-auto flex min-h-[64px] w-full max-w-[1100px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex min-h-[44px] flex-col items-start justify-center"
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
            className="inline-flex min-h-[44px] items-center rounded border border-dusk/25 px-3.5 text-sm font-medium text-dusk hover:bg-dusk/10"
          >
            Visit pHavelength
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1100px] px-4 py-10 text-left sm:px-6">
        <div className="mx-auto max-w-[640px] rounded-lg border border-dusk/20 bg-fog p-6 sm:p-8">
          {loading ? (
            <p className="text-sm text-ink/80">Loading meetup plan...</p>
          ) : error || !plan ? (
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-dusk">
                Meetup plan unavailable
              </h1>
              <p
                role="alert"
                className="rounded border border-marigold bg-marigold/20 p-3.5 text-sm font-medium text-ink"
              >
                {error || "This plan link has expired or doesn't exist."}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <span className="inline-block rounded border border-teal/50 bg-teal/15 px-2.5 py-0.5 text-xs font-medium text-ink">
                  Shared meetup check-in
                </span>
                <h1 className="mt-2 text-2xl font-bold text-dusk">
                  {plan.creatorFirstName} is meeting {plan.partnerFirstName}
                </h1>
              </div>

              <dl className="space-y-3 rounded-lg border border-dusk/15 bg-dusk/5 p-4 text-sm">
                <div>
                  <dt className="text-xs font-medium text-ink/75">Place</dt>
                  <dd className="mt-0.5 font-serif text-base font-medium text-dusk">
                    {plan.placeName}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-ink/75">
                    Date and time
                  </dt>
                  <dd className="mt-0.5 font-serif text-base text-ink">
                    {new Date(plan.planTime).toLocaleString()}
                  </dd>
                </div>
              </dl>

              <p className="text-xs leading-relaxed text-ink/75">
                This temporary safety check-in link shares only first names,
                place, and time, and expires automatically 24 hours after the
                meetup time.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
