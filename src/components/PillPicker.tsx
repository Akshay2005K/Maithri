"use client";

import { useState } from "react";
import OptionDialog from "./OptionDialog";
import { getOptionLabel, type ProfileOption } from "@/lib/profileOptions";

interface BasePillPickerProps {
  label?: string;
  placeholder: string;
  dialogTitle: string;
  dialogSubtitle?: string;
  options: readonly ProfileOption[];
  required?: boolean;
}

interface SinglePillPickerProps extends BasePillPickerProps {
  mode: "single";
  value: string | null;
  onChange: (nextValue: string | null) => void;
}

interface MultiPillPickerProps extends BasePillPickerProps {
  mode: "multi";
  values: string[];
  maxSelections?: number;
  onChange: (nextValues: string[]) => void;
}

export type PillPickerProps = SinglePillPickerProps | MultiPillPickerProps;

export default function PillPicker(props: PillPickerProps) {
  const {
    label,
    placeholder,
    dialogTitle,
    dialogSubtitle,
    options,
    required = false,
  } = props;
  const [open, setOpen] = useState(false);

  if (props.mode === "single") {
    const selectedLabel = getOptionLabel(options, props.value);
    const hasValue = Boolean(props.value && selectedLabel);

    return (
      <div>
        {label && (
          <div className="mb-1.5 block text-xs font-medium text-ink">
            {label}
            {required && (
              <span aria-hidden="true" className="ml-0.5 text-dusk">
                *
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              hasValue
                ? "border-teal bg-dusk text-fog hover:bg-dusk/90"
                : "border-dashed border-dusk/40 bg-fog text-dusk hover:border-dusk hover:bg-dusk/5"
            }`}
          >
            <span>{hasValue ? selectedLabel : `+ ${placeholder}`}</span>
            <span
              aria-hidden="true"
              className={`text-xs ${hasValue ? "text-fog/80" : "text-dusk/70"}`}
            >
              ▾
            </span>
          </button>
        </div>

        <OptionDialog
          open={open}
          mode="single"
          title={dialogTitle}
          subtitle={dialogSubtitle}
          options={options}
          value={props.value}
          onChange={props.onChange}
          onClose={() => setOpen(false)}
        />
      </div>
    );
  }

  // Multi-select mode
  const validValues = props.values.filter((val) =>
    options.some((o) => o.value === val)
  );
  const hasValues = validValues.length > 0;
  const maxText =
    typeof props.maxSelections === "number"
      ? `${validValues.length}/${props.maxSelections}`
      : `${validValues.length}`;

  return (
    <div>
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink">
          <span>
            {label}
            {required && (
              <span aria-hidden="true" className="ml-0.5 text-dusk">
                *
              </span>
            )}
          </span>
          {typeof props.maxSelections === "number" && (
            <span className="text-ink/70">
              {validValues.length}/{props.maxSelections} selected
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {validValues.map((val) => {
          const itemLabel = getOptionLabel(options, val) ?? val;
          return (
            <button
              key={val}
              type="button"
              onClick={() => setOpen(true)}
              aria-label={`${itemLabel} (click to edit ${dialogTitle.toLowerCase()})`}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-teal bg-dusk px-3.5 py-2 text-xs font-medium text-fog hover:bg-dusk/90"
            >
              <span>{itemLabel}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-dashed border-dusk/40 bg-fog px-4 py-2 text-xs font-medium text-dusk hover:border-dusk hover:bg-dusk/5"
        >
          <span>
            {hasValues ? `+ Edit (${maxText})` : `+ ${placeholder}`}
          </span>
        </button>
      </div>

      <OptionDialog
        open={open}
        mode="multi"
        title={dialogTitle}
        subtitle={dialogSubtitle}
        options={options}
        values={validValues}
        maxSelections={props.maxSelections}
        onChange={props.onChange}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
