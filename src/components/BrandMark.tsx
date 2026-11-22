export default function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-left">
      <img
        src="/maithri-logo.png"
        alt=""
        aria-hidden="true"
        className={`${
          compact ? "h-8" : "h-10"
        } w-auto shrink-0 rounded-md bg-white px-1 py-0.5 object-contain`}
      />
      <span className="flex flex-col">
        <span className="text-xl font-bold tracking-tight text-dusk">
          Maithri
        </span>
        <span className="text-xs text-ink/75">
          Where Connections Become Meaningful.
        </span>
      </span>
    </span>
  );
}
