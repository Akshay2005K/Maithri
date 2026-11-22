import Link from "next/link";
import BrandMark from "@/components/BrandMark";

export default function TermsPage() {
  return (
    <>
      <header className="border-b border-dusk/15 bg-fog">
        <div className="mx-auto flex min-h-[64px] w-full max-w-[1100px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex min-h-[44px] flex-col items-start justify-center"
          >
            <BrandMark />
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded border border-dusk/25 px-3.5 text-sm font-medium text-dusk hover:bg-dusk/10"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1100px] px-4 py-8 text-left sm:px-6">
        <div className="max-w-[640px] space-y-6">
          <div className="border-b border-dusk/15 pb-4">
            <h1 className="text-2xl font-bold text-dusk">Terms of use</h1>
          </div>

          <p className="rounded border border-marigold bg-marigold/20 p-3.5 text-xs leading-relaxed text-ink">
            Prototype notice: These terms are written in plain language for this
            assignment prototype. A production launch requires formal legal
            review.
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-dusk">
              Eligibility (18 and older only)
            </h2>
            <p className="font-serif text-sm leading-relaxed text-ink/90">
              You must be at least 18 years old to create an account or use
              pHavelength. The 18+ requirement is enforced both in the
              onboarding form and via a database constraint (
              <code>age &gt;= 18</code>).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-dusk">
              Simulated features disclosure
            </h2>
            <p className="font-serif text-sm leading-relaxed text-ink/90">
              All eLitmus batch and verification badges are simulated for this
              prototype (&ldquo;Simulated eLitmus verification
              (prototype)&rdquo;) and company domains are self-declared. The
              Plus upgrade modal is a{" "}
              <strong>mock paywall, no payment</strong> is collected.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-dusk">
              Respectful conduct and reporting
            </h2>
            <p className="font-serif text-sm leading-relaxed text-ink/90">
              Harassment, impersonation, or spam is prohibited. Any user can
              report and block another user directly inside Chat, which
              immediately removes the match and prevents future matching between
              those accounts.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
