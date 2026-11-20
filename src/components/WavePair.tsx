interface WavePairProps {
  score: number;
  label?: string;
  size?: "sm" | "lg";
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
    <div className={size === "lg" ? "space-y-2" : "inline-flex items-center gap-2.5"}>
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
      <span className="text-xs font-medium text-ink/80">
        {label ?? `${clamped}% compatibility`}
      </span>
    </div>
  );
}
