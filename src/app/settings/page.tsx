"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { supabase } from "@/lib/supabase";

type ThemePreference = "system" | "light" | "dark";

const THEME_STORAGE_KEY = "phavelength-theme";

const APPEARANCE_OPTIONS: {
  value: ThemePreference;
  label: string;
  description: string;
}[] = [
  {
    value: "system",
    label: "Use system setting",
    description: "Match your device or browser light and dark appearance.",
  },
  {
    value: "light",
    label: "Light",
    description: "Fog background with dark ink text and dusk accents.",
  },
  {
    value: "dark",
    label: "Dark",
    description:
      "Deep night background with soft fog text and high-contrast accents.",
  },
];

function applyThemePreference(pref: ThemePreference) {
  if (typeof window === "undefined") return;
  const isDark =
    pref === "dark" ||
    (pref === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "dark" : "light"
  );
  document.documentElement.setAttribute("data-theme-pref", pref);
}

export default function SettingsPage() {
  const [themePref, setThemePref] = useState<ThemePreference>("system");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === "light" || saved === "dark" || saved === "system") {
        setThemePref(saved);
        applyThemePreference(saved);
      } else {
        setThemePref("system");
        applyThemePreference("system");
      }
    } catch {
      setThemePref("system");
      applyThemePreference("system");
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const confirmed = session?.user?.email_confirmed_at
        ? session.user.email ?? null
        : null;
      setUserEmail(confirmed);
    });
  }, []);

  useEffect(() => {
    if (themePref !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyThemePreference("system");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [themePref]);

  function handleThemeChange(nextPref: ThemePreference) {
    setThemePref(nextPref);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextPref);
    } catch {
      // Ignore storage quota or private-mode errors
    }
    applyThemePreference(nextPref);
  }

  return (
    <>
      <header className="border-b border-dusk/15 bg-fog">
        <div className="mx-auto flex min-h-[64px] w-full max-w-[1100px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex min-h-[44px] flex-col items-start justify-center"
          >
            <BrandMark />
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded border border-dusk/25 bg-fog px-4 text-sm font-medium text-dusk hover:bg-dusk/10"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1100px] px-4 py-8 text-left sm:px-6">
        <div className="mx-auto max-w-[640px] space-y-8">
          <div className="border-b border-dusk/15 pb-4">
            <h1 className="text-2xl font-bold text-dusk">Settings</h1>
            <p className="mt-1 text-sm text-ink/80">
              Manage your display theme and view legal and safety resources.
            </p>
          </div>

          {/* Section 1: Appearance */}
          <section className="space-y-4 rounded-lg border border-dusk/20 bg-fog p-6">
            <div>
              <h2 className="text-lg font-semibold text-dusk">Appearance</h2>
              <p className="mt-0.5 text-xs text-ink/75">
                Choose how Maithri looks on this browser.
              </p>
            </div>

            <fieldset className="divide-y divide-dusk/15 rounded-lg border border-dusk/20">
              <legend className="sr-only">Appearance theme</legend>
              {APPEARANCE_OPTIONS.map((opt) => {
                const checked = themePref === opt.value;
                return (
                  <label
                    key={opt.value}
                    htmlFor={`theme-${opt.value}`}
                    className={`flex min-h-[56px] cursor-pointer items-center justify-between gap-4 px-4 py-3 transition-colors ${
                      checked ? "bg-dusk/10" : "hover:bg-dusk/5"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="block text-sm font-medium text-ink">
                        {opt.label}
                      </span>
                      <span className="block text-xs text-ink/75">
                        {opt.description}
                      </span>
                    </div>
                    <input
                      id={`theme-${opt.value}`}
                      type="radio"
                      name="appearance-theme"
                      value={opt.value}
                      checked={checked}
                      onChange={() => handleThemeChange(opt.value)}
                      className="h-5 w-5 shrink-0 accent-teal"
                    />
                  </label>
                );
              })}
            </fieldset>
          </section>

          {/* Section 2: Account */}
          <section className="space-y-4 rounded-lg border border-dusk/20 bg-fog p-6">
            <div>
              <h2 className="text-lg font-semibold text-dusk">Account</h2>
              <p className="mt-0.5 text-xs text-ink/75">
                {userEmail
                  ? `Signed in as ${userEmail}`
                  : "Policies and safety guidelines."}
              </p>
            </div>

            {/* Links to Privacy, Terms, Grievance, Safety */}
            <nav
              aria-label="Legal and safety pages"
              className="divide-y divide-dusk/15 rounded-lg border border-dusk/20"
            >
              {[
                {
                  href: "/privacy",
                  label: "Privacy notice",
                  detail: "What data we collect, store, and delete under DPDP",
                },
                {
                  href: "/terms",
                  label: "Terms of use",
                  detail: "Eligibility, community standards, and prototype rules",
                },
                {
                  href: "/grievance",
                  label: "Grievance contact",
                  detail: "How to report concerns or data requests",
                },
                {
                  href: "/safety",
                  label: "Safety tips",
                  detail: "Practical tips for chatting and meeting safely",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-[52px] items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-dusk/5"
                >
                  <div>
                    <span className="block text-sm font-medium text-dusk">
                      {item.label}
                    </span>
                    <span className="block text-xs text-ink/75">
                      {item.detail}
                    </span>
                  </div>
                  <span aria-hidden="true" className="text-sm text-dusk/70">
                    →
                  </span>
                </Link>
              ))}
            </nav>
          </section>
        </div>
      </main>
    </>
  );
}
