import type { CompatibilityBreakdown } from "@/lib/matching";

interface WavePairProps {
  score: number;
  label?: string;
  size?: "sm" | "lg";
  breakdown?: CompatibilityBreakdown;
  showDisclaimer?: boolean;
}

function buildSinePath(
  width: number,
  height: number,
  amplitude: number,
  cycles: number,
  phaseOffset: number
): string {
  const midY = height / 2;
  const steps = 60;
  const points: string[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = t * width;
    const y = midY + amplitude * Math.sin(t * cycles * Math.PI * 2 + phaseOffset);
    points.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return points.join(" ");
}

export default function WavePair({
  score,
  label,
  size = "sm",
  breakdown,
  showDisclaimer = false,
}: WavePairProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const phaseOffset = ((100 - clamped) / 100) * Math.PI;

  const width = size === "lg" ? 320 : 140;
  const height = size === "lg" ? 72 : 36;
  const amplitude = size === "lg" ? 20 : 10;
  const strokeWidth = size === "lg" ? 3 : 2.25;

  const tealPath = buildSinePath(width, height, amplitude, 2, 0);
  const marigoldPath = buildSinePath(width, height, amplitude, 2, phaseOffset);

  return (
    <div className={size === "lg" ? "space-y-2" : "space-y-2.5"}>
      <div
        className={
          size === "lg" ? "space-y-2" : "inline-flex items-center gap-2.5"
        }
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={label ?? `${clamped}% compatibility`}
          className="block shrink-0"
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

      {breakdown && (
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
      )}

      {(showDisclaimer || breakdown) && (
        <p className="text-[11px] leading-snug text-ink/70">
          Guide based on your 5 quiz answers and relationship goal — not a
          scientific prediction.
        </p>
      )}
    </div>
  );
}
