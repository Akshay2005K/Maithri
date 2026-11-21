"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-[640px] flex-col justify-center px-4 py-12 text-left sm:px-6">
      <div className="space-y-4 rounded-lg border-2 border-marigold bg-fog p-6">
        <span className="inline-block rounded border border-marigold bg-marigold/20 px-2.5 py-0.5 text-xs font-medium text-ink">
          Something went wrong
        </span>
        <h1 className="text-2xl font-bold text-dusk">
          We hit an unexpected error
        </h1>
        <p className="font-serif text-sm leading-relaxed text-ink/90">
          {error.message || "An unexpected client error occurred."}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-[44px] items-center rounded bg-dusk px-4 text-sm font-medium text-fog hover:bg-dusk/90"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded border border-dusk/25 bg-fog px-4 text-sm font-medium text-dusk hover:bg-dusk/10"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
