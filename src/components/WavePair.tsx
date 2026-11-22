"use client";

import { useState } from "react";
import Link from "next/link";
import type { CompatibilityBreakdown } from "@/lib/matching";

interface WavePairProps {
  score: number;
  label?: string;
  size?: "sm" | "lg";
  breakdown?: CompatibilityBreakdown | null;
  reasonsLocked?: boolean;
  showDisclaimer?: boolean;
}

const PLACEHOLDER_CHIPS = [
  "Relationship goal",
  "City alignment",
  "Shared interests",
];

const PLACEHOLDER_FACTORS = [
  { key: "p1", label: "Work-life rhythm", width: 68 },
  { key: "p2", label: "Weekend battery", width: 54 },
  { key: "p3", label: "Financial style", width: 72 },
  { key: "p4", label: "Conflict style", width: 60 },
  { key: "p5", label: "City flexibility", width: 64 },
];

function buildSinePath(
  width: number,
  height: number,
  amplitude: number,
  cycles: number,
  phase: number
): string {
  const mid = height / 2;
  const steps = 48;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = t * width;
    const y = mid + Math.sin(t * Math.PI * 2 * cycles + phase) * amplitude;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

function LockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function WavePair({
  score,
  label,
  size = "sm",
  breakdown,
  reasonsLocked = false,
  showDisclaimer = false,
}: WavePairProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tapped, setTapped] = useState(false);

  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const phaseOffset = ((100 - clamped) / 100) * Math.PI;
  const width = size === "lg" ? 120 : 88;
  const height = size === "lg" ? 32 : 24;
  const amp = size === "lg" ? 9 : 6.5;
  const strokeWidth = size === "lg" ? 2.25 : 2;

  const tealPath = buildSinePath(width, height, amp, 2, 0);
  const marigoldPath = buildSinePath(width, height, amp, 2, phaseOffset);

  const overlayOpen = hovered || focused || tapped;

  return (
    <div className="space-y-2">
      <div className="inline-flex items-center gap-2.5">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden="true"
          className="shrink-0"
        >
          <path
            d={tealPath}
            fill="none"
            stroke="var(--color-teal)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path
            d={marigoldPath}
            fill="none"
            stroke="var(--color-marigold)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </svg>
        <span className="text-xs font-semibold text-dusk">
          {label ?? `${clamped}% compatibility`}
        </span>
      </div>

      {reasonsLocked ? (
        <div
          role="region"
          aria-label="Match reasons are available on Plus and Pro."
          tabIndex={0}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setFocused(false);
              setTapped(false);
            }
          }}
          onClick={() => setTapped((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setHovered(false);
              setFocused(false);
              setTapped(false);
              (e.currentTarget as HTMLElement).blur();
            }
          }}
          className="relative cursor-pointer overflow-hidden rounded border border-dusk/20 bg-dusk/5 p-3 text-left text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2"
        >
          {/* Fixed generic placeholder content, never real values */}
          <div
            aria-hidden="true"
            className="pointer-events-none select-none space-y-2 blur-[5px]"
          >
            <div className="flex flex-wrap gap-1.5">
              {PLACEHOLDER_CHIPS.map((chip) => (
                <span
                  key={chip}
                  className="rounded border border-dusk/20 bg-fog px-2 py-0.5 font-medium text-ink"
                >
                  {chip}
                </span>
              ))}
            </div>
            <div className="space-y-1.5 pt-0.5">
              {PLACEHOLDER_FACTORS.map((factor) => (
                <div key={factor.key} className="space-y-0.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-ink/85">
                    <span>{factor.label}</span>
                    <span className="font-semibold text-dusk">
                      {factor.width}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-dusk/15">
                    <div
                      className="h-full rounded-full bg-teal"
                      style={{ width: `${factor.width}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Persistent lock badge for touch & glanceability */}
          <div
            className={`absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-dusk/25 bg-fog/95 px-2.5 py-1 text-[11px] font-semibold text-dusk shadow-sm transition-opacity duration-150 motion-reduce:transition-none ${
              overlayOpen ? "opacity-0" : "opacity-100"
            }`}
          >
            <LockIcon size={12} />
            <span>Plus and Pro</span>
          </div>

          {/* Reveal overlay on hover / keyboard focus / tap */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-fog/90 p-4 text-center backdrop-blur-[2px] transition-opacity duration-150 motion-reduce:transition-none ${
              overlayOpen
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-dusk/20 bg-dusk/10 text-dusk">
              <LockIcon size={16} />
            </span>
            <p className="text-xs font-semibold text-dusk">
              Match reasons are part of Plus and Pro
            </p>
            <Link
              href="/upgrade"
              tabIndex={overlayOpen ? 0 : -1}
              className="inline-flex min-h-[44px] items-center justify-center rounded bg-dusk px-4 text-xs font-medium text-fog transition-colors hover:bg-dusk/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              Upgrade
            </Link>
          </div>
        </div>
      ) : (
        breakdown && (
          <div className="space-y-2 rounded border border-dusk/15 bg-dusk/5 p-3 text-left text-xs">
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded border border-teal/40 bg-teal/15 px-2 py-0.5 font-medium text-ink">
                {breakdown.goalSummary}
              </span>
              <span className="rounded border border-dusk/20 bg-fog px-2 py-0.5 font-medium text-ink">
                {breakdown.cityLabel}
              </span>
              {breakdown.sharedInterests.length > 0 && (
                <span className="rounded border border-marigold/60 bg-marigold/20 px-2 py-0.5 font-medium text-ink">
                  Shared: {breakdown.sharedInterests.slice(0, 3).join(", ")}
                  {breakdown.sharedInterests.length > 3
                    ? ` +${breakdown.sharedInterests.length - 3}`
                    : ""}
                </span>
              )}
            </div>

            <div className="space-y-1.5 pt-0.5">
              {breakdown.factors.map((factor) => (
                <div key={factor.key} className="space-y-0.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-ink/85">
                    <span>{factor.label}</span>
                    <span className="font-semibold text-dusk">
                      {factor.score}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-dusk/15">
                    <div
                      className="h-full rounded-full bg-teal"
                      style={{ width: `${factor.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {(showDisclaimer || breakdown || reasonsLocked) && (
        <p className="text-[11px] leading-snug text-ink/70">
          Guide based on your 5 quiz answers and relationship goal — not a
          scientific prediction.
        </p>
      )}
    </div>
  );
}
