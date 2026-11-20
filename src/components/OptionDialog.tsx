"use client";

import { useEffect, useId, useRef } from "react";
import type { ProfileOption } from "@/lib/profileOptions";

interface BaseOptionDialogProps {
  open: boolean;
  title: string;
  subtitle?: string;
  options: readonly ProfileOption[];
  onClose: () => void;
}

interface SingleOptionDialogProps extends BaseOptionDialogProps {
  mode: "single";
  value: string | null;
  onChange: (nextValue: string | null) => void;
}

interface MultiOptionDialogProps extends BaseOptionDialogProps {
  mode: "multi";
  values: string[];
  maxSelections?: number;
  onChange: (nextValues: string[]) => void;
}

export type OptionDialogProps =
  | SingleOptionDialogProps
  | MultiOptionDialogProps;

export default function OptionDialog(props: OptionDialogProps) {
  const { open, title, subtitle, options, onClose } = props;
  const dialogRef = useRef<HTMLDivElement>(null);
  const doneButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const subtitleId = useId();

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    // Move initial focus inside the dialog
    const firstOption =
      dialogRef.current?.querySelector<HTMLElement>("[data-option-button]");
    if (firstOption) {
      firstOption.focus();
    } else {
      doneButtonRef.current?.focus();
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
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
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const isMulti = props.mode === "multi";
  const selectedCount = isMulti
    ? props.values.length
    : props.value
      ? 1
      : 0;
  const maxSelections = isMulti ? props.maxSelections : 1;
  const atMax =
    isMulti &&
    typeof maxSelections === "number" &&
    props.values.length >= maxSelections;

  function handleOptionClick(optionValue: string) {
    if (props.mode === "single") {
      if (props.value === optionValue) {
        props.onChange(null);
      } else {
        props.onChange(optionValue);
      }
    } else {
      const exists = props.values.includes(optionValue);
      if (exists) {
        props.onChange(props.values.filter((v) => v !== optionValue));
      } else {
        if (
          typeof props.maxSelections === "number" &&
          props.values.length >= props.maxSelections
        ) {
          return;
        }
        props.onChange([...props.values, optionValue]);
      }
    }
  }

  function handleClear() {
    if (props.mode === "single") {
      props.onChange(null);
    } else {
      props.onChange([]);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={subtitle || isMulti ? subtitleId : undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-0 sm:items-center sm:p-4"
    >
      <div
        ref={dialogRef}
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl border-t-2 border-dusk/30 bg-fog text-left sm:rounded-lg sm:border-2"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-dusk/15 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-dusk">
              {title}
            </h2>
            {(subtitle || isMulti) && (
              <p id={subtitleId} className="mt-0.5 text-xs text-ink/80">
                {subtitle ? `${subtitle} ` : ""}
                {isMulti && maxSelections
                  ? `(${props.values.length}/${maxSelections} selected)`
                  : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-sm font-medium text-dusk hover:bg-dusk/10"
          >
            ✕
          </button>
        </div>

        {/* Option list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-wrap gap-2.5">
            {options.map((opt) => {
              const selected =
                props.mode === "single"
                  ? props.value === opt.value
                  : props.values.includes(opt.value);
              const disabled = !selected && Boolean(atMax);

              return (
                <button
                  key={opt.value}
                  type="button"
                  data-option-button
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() => handleOptionClick(opt.value)}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    selected
                      ? "border-teal bg-dusk text-fog"
                      : "border-dusk/30 bg-fog text-ink hover:border-dusk hover:bg-dusk/5 disabled:cursor-not-allowed disabled:opacity-45"
                  }`}
                >
                  <span>{opt.label}</span>
                  {selected && (
                    <span
                      aria-hidden="true"
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-teal text-[11px] font-bold text-[#12122B]"
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer with Clear and Done */}
        <div className="flex items-center justify-between gap-3 border-t border-dusk/15 px-5 py-3.5">
          <button
            type="button"
            onClick={handleClear}
            disabled={selectedCount === 0}
            className="inline-flex min-h-[44px] items-center justify-center rounded border border-dusk/30 px-4 py-2 text-xs font-medium text-dusk hover:bg-dusk/10 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Clear
          </button>

          <button
            ref={doneButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[110px] items-center justify-center rounded bg-dusk px-5 py-2 text-sm font-medium text-fog hover:bg-dusk/90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
