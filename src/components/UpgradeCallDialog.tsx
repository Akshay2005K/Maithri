"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";

interface UpgradeCallDialogProps {
  open: boolean;
  requiredPlan: "plus" | "pro" | null;
  onClose: () => void;
}

export default function UpgradeCallDialog({
  open,
  requiredPlan,
  onClose,
}: UpgradeCallDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const seePlansRef = useRef<HTMLAnchorElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const prevFocus = document.activeElement as HTMLElement | null;
    seePlansRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
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
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!open || !requiredPlan) return null;

  const message =
    requiredPlan === "pro"
      ? "Video calls are part of Pro."
      : "Voice calls are part of Plus and Pro.";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-0 sm:items-center sm:p-4"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md space-y-4 rounded-t-xl border border-dusk/20 bg-fog p-6 text-left shadow-xl sm:rounded-xl"
      >
        <div className="space-y-1.5">
          <h2 id={titleId} className="text-lg font-bold text-dusk">
            {requiredPlan === "pro" ? "Pro plan required" : "Plus or Pro required"}
          </h2>
          <p className="text-sm leading-relaxed text-ink/85">{message}</p>
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded border border-dusk/25 bg-fog px-4 text-sm font-medium text-ink transition-colors hover:bg-dusk/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Not now
          </button>
          <Link
            ref={seePlansRef}
            href="/upgrade"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded bg-dusk px-4 text-sm font-medium text-fog transition-colors hover:bg-dusk/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            See plans
          </Link>
        </div>
      </div>
    </div>
  );
}
