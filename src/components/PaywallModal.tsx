"use client";

import { useState } from "react";
import { supabase, type Profile } from "@/lib/supabase";

interface PaywallModalProps {
  profile: Profile;
  onClose: () => void;
  onUnlocked: (updatedProfile: Profile) => void;
}

export default function PaywallModal({
  profile,
  onClose,
  onUnlocked,
}: PaywallModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleActivateMockPlus() {
    setError(null);
    setSaving(true);

    const { data, error: dbErr } = await supabase
      .from("profiles")
      .update({ is_plus_mock: true })
      .eq("id", profile.id)
      .select()
      .single();

    setSaving(false);

    if (dbErr) {
      setError(`${dbErr.message} Please try activating again.`);
      return;
    }

    onUnlocked(data as Profile);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
    >
      <div className="w-full max-w-md rounded-lg border-2 border-dusk/30 bg-fog p-6 text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-block rounded border border-marigold bg-marigold/20 px-2.5 py-0.5 text-xs font-medium text-ink">
              Mock paywall, no payment
            </span>
            <h2
              id="paywall-heading"
              className="mt-2.5 text-xl font-bold text-dusk"
            >
              Unlock 4th daily match
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center rounded border border-dusk/25 px-3 text-xs font-medium text-dusk hover:bg-dusk/10"
          >
            Close
          </button>
        </div>

        <p className="mt-3 font-serif text-sm leading-relaxed text-ink/90">
          Core matching, Privacy Shield, and chat are free.{" "}
          <strong>pHavelength Plus (mock ₹199/month)</strong> unlocks a fourth
          curated match per day when more compatible candidates are available.
        </p>

        <div className="mt-4 rounded border border-dusk/15 bg-dusk/5 p-3.5 text-xs leading-relaxed text-ink/85">
          This is a prototype demo toggle. Selecting unlock sets{" "}
          <code>is_plus_mock = true</code> on your profile without charging any
          money.
        </div>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded border border-marigold bg-marigold/20 p-3 text-xs font-medium text-ink"
          >
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={saving}
            onClick={handleActivateMockPlus}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded bg-dusk px-4 py-2 text-sm font-medium text-fog hover:bg-dusk/90 disabled:opacity-50"
          >
            {saving ? "Activating demo Plus..." : "Simulate Plus unlock (free demo)"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded border border-dusk/25 bg-fog px-4 py-2 text-sm font-medium text-ink hover:bg-dusk/10"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
