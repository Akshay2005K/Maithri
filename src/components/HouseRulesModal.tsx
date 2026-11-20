"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

interface HouseRulesModalProps {
  onAgree: () => void;
  onSignOut: () => void;
  saving?: boolean;
  error?: string | null;
}

const HOUSE_RULES = [
  {
    title: "Be yourself",
    body: "Make sure your profile details, prompts, and relationship goal honestly represent who you are.",
  },
  {
    title: "Stay safe",
    body: "Hold off on sharing personal contact details or financial information too early.",
    hasSafetyLink: true,
  },
  {
    title: "Be thoughtful",
    body: "Write genuine messages of four or more words and treat every match's time and boundaries with respect.",
  },
  {
    title: "Report bad behavior",
    body: "Use Report and block inside chat right away if someone behaves disrespectfully or makes you uncomfortable.",
  },
];

export default function HouseRulesModal({
  onAgree,
  onSignOut,
  saving = false,
  error = null,
}: HouseRulesModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const agreeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    agreeBtnRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        // Cannot be dismissed with Escape
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="house-rules-title"
      aria-describedby="house-rules-subtitle"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
    >
      <div
        ref={dialogRef}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border-2 border-dusk/30 bg-fog p-6 text-left"
      >
        <h2 id="house-rules-title" className="text-2xl font-bold text-dusk">
          Welcome to pHavelength.
        </h2>
        <p id="house-rules-subtitle" className="mt-1 text-sm text-ink/80">
          Please follow these house rules.
        </p>

        <div className="mt-5 space-y-4">
          {HOUSE_RULES.map((rule) => (
            <div
              key={rule.title}
              className="rounded border border-dusk/15 bg-dusk/5 p-3.5"
            >
              <h3 className="text-sm font-semibold text-dusk">{rule.title}</h3>
              <p className="mt-1 font-serif text-sm leading-relaxed text-ink/90">
                {rule.body}{" "}
                {rule.hasSafetyLink && (
                  <Link
                    href="/safety"
                    target="_blank"
                    className="font-sans text-xs font-medium text-dusk underline decoration-teal underline-offset-4 hover:text-ink"
                  >
                    Read safety tips
                  </Link>
                )}
              </p>
            </div>
          ))}
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded border border-marigold bg-marigold/20 p-3 text-xs font-medium text-ink"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            ref={agreeBtnRef}
            type="button"
            disabled={saving}
            onClick={onAgree}
            className="min-h-[44px] w-full rounded bg-dusk px-5 py-2.5 text-sm font-medium text-fog hover:bg-dusk/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "I agree"}
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex min-h-[44px] items-center justify-center rounded px-4 text-xs font-medium text-dusk underline decoration-dusk/40 underline-offset-4 hover:bg-dusk/10"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
