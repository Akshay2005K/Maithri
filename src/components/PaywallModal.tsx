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
      setError(dbErr.message);
      return;
    }

    onUnlocked(data as Profile);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-block rounded border border-amber-800/50 bg-amber-950/60 px-2 py-0.5 text-[11px] font-medium text-amber-300">
              Mock paywall, no payment
            </span>
            <h2 className="mt-2 text-lg font-semibold text-white">
              Unlock 4th Daily Match
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Close
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate-300">
          Core matching, Privacy Shield, and chat are free.{" "}
          <strong>pHavelength Plus (mock ₹199/month)</strong> unlocks a 4th
          curated match per day when more compatible candidates are available.
        </p>

        <div className="mt-4 rounded border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
          This is a prototype demo toggle. Clicking below sets{" "}
          <code>is_plus_mock = true</code> on your profile without charging any
          money.
        </div>

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={handleActivateMockPlus}
            className="flex-1 rounded bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? "Activating..." : "Simulate Plus Unlock (Free Demo)"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
