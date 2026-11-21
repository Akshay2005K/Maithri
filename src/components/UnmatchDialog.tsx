"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CLOSURE_REASONS, type ClosureReasonKey } from "@/lib/closureReasons";

interface UnmatchDialogProps {
  open: boolean;
  partnerName: string;
  submitting: boolean;
  error: string | null;
  onConfirm: (reason: ClosureReasonKey) => void;
  onClose: () => void;
}

export default function UnmatchDialog({
  open,
  partnerName,
  submitting,
  error,
  onConfirm,
  onClose,
}: UnmatchDialogProps) {
  const [selectedReason, setSelectedReason] = useState<ClosureReasonKey | "">(
    ""
  );
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      setSelectedReason("");
      return;
    }

    const prevFocus = document.activeElement as HTMLElement | null;
    const firstRadio = dialogRef.current?.querySelector<HTMLElement>(
      'input[type="radio"]'
    );
    (firstRadio ?? cancelBtnRef.current)?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-0 sm:items-center sm:p-4"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-t-2xl border-t-2 border-dusk/30 bg-fog p-6 text-left sm:rounded-lg sm:border-2"
      >
        <h2 id={titleId} className="text-xl font-bold text-dusk">
          Unmatch with {partnerName}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-ink/80">
          Pick a polite closure note. It will be shown to {partnerName} so the
          conversation ends clearly, and the chat will become read-only.
        </p>

        <fieldset className="mt-4 space-y-2.5">
          <legend className="text-xs font-semibold text-dusk">
            Select a reason (required)
          </legend>
          {CLOSURE_REASONS.map((item) => {
            const checked = selectedReason === item.key;
            return (
              <label
                key={item.key}
                htmlFor={`unmatch-reason-${item.key}`}
                className={`flex min-h-[44px] cursor-pointer items-start gap-3 rounded border p-3 text-xs leading-relaxed transition-colors ${
                  checked
                    ? "border-teal bg-dusk text-fog"
                    : "border-dusk/25 bg-fog text-ink hover:bg-dusk/5"
                }`}
              >
                <input
                  id={`unmatch-reason-${item.key}`}
                  type="radio"
                  name="unmatch_closure_reason"
                  value={item.key}
                  checked={checked}
                  onChange={() => setSelectedReason(item.key)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-teal"
                />
                <span>{item.message}</span>
              </label>
            );
          })}
        </fieldset>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded border border-marigold bg-marigold/20 p-2.5 text-xs font-medium text-ink"
          >
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelBtnRef}
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded border border-dusk/30 bg-fog px-4 text-xs font-medium text-ink hover:bg-dusk/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedReason || submitting}
            onClick={() => selectedReason && onConfirm(selectedReason)}
            className="inline-flex min-h-[44px] items-center justify-center rounded bg-dusk px-4 text-xs font-medium text-fog hover:bg-dusk/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Send and unmatch"}
          </button>
        </div>
      </div>
    </div>
  );
}
