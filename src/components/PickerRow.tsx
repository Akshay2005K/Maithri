"use client";

import { useState } from "react";
import OptionDialog from "./OptionDialog";
import { getOptionLabel, type ProfileOption } from "@/lib/profileOptions";

interface BasePickerRowProps {
  label: string;
  dialogTitle?: string;
  dialogSubtitle?: string;
  options: readonly ProfileOption[];
}

interface SinglePickerRowProps extends BasePickerRowProps {
  mode: "single";
  value: string | null;
  onChange: (nextValue: string | null) => void;
}

interface MultiPickerRowProps extends BasePickerRowProps {
  mode: "multi";
  values: string[];
  maxSelections?: number;
  onChange: (nextValues: string[]) => void;
}

export type PickerRowProps = SinglePickerRowProps | MultiPickerRowProps;

export default function PickerRow(props: PickerRowProps) {
  const { label, dialogTitle, dialogSubtitle, options } = props;
  const [open, setOpen] = useState(false);

  const effectiveTitle = dialogTitle ?? label;

  let displayValue: string | null = null;
  if (props.mode === "single") {
    displayValue = getOptionLabel(options, props.value);
  } else {
    const validLabels = props.values
      .map((val) => getOptionLabel(options, val))
      .filter((lbl): lbl is string => Boolean(lbl));
    if (validLabels.length > 0) {
      displayValue = validLabels.join(", ");
    }
  }

  const hasSelection = Boolean(displayValue);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex min-h-[48px] w-full items-center justify-between gap-4 border-b border-dusk/15 px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-dusk/5"
      >
        <span className="text-sm font-medium text-ink">{label}</span>

        <span className="flex items-center gap-2 text-right">
          <span
            className={`max-w-[220px] truncate text-sm sm:max-w-[320px] ${
              hasSelection ? "font-medium text-dusk" : "text-ink/70"
            }`}
          >
            {displayValue ?? "Select"}
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="h-4 w-4 shrink-0 text-dusk/70"
          >
            <path
              d="M7.5 5L12.5 10L7.5 15"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {props.mode === "single" ? (
        <OptionDialog
          open={open}
          mode="single"
          title={effectiveTitle}
          subtitle={dialogSubtitle}
          options={options}
          value={props.value}
          onChange={props.onChange}
          onClose={() => setOpen(false)}
        />
      ) : (
        <OptionDialog
          open={open}
          mode="multi"
          title={effectiveTitle}
          subtitle={dialogSubtitle}
          options={options}
          values={props.values}
          maxSelections={props.maxSelections}
          onChange={props.onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
