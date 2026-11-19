import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-5 p-6 text-sm text-slate-300">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white">Terms of Use</h1>
        <Link href="/" className="text-xs text-violet-400 hover:underline">
          &larr; Back to App
        </Link>
      </div>

      <p className="text-xs text-amber-300/90">
        Prototype notice: These terms are written in plain language for this
        assignment prototype. A production launch requires formal legal review.
      </p>

      <section className="space-y-2">
        <h2 className="font-semibold text-white">1. Eligibility (18+ Only)</h2>
        <p className="text-xs leading-relaxed">
          You must be at least 18 years old to create an account or use
          pHavelength. The 18+ requirement is enforced both in the onboarding
          form and via a database constraint (<code>age &gt;= 18</code>).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-white">
          2. Simulated Features Disclosure
        </h2>
        <p className="text-xs leading-relaxed">
          All eLitmus batch/verification badges are simulated for this
          prototype (&quot;Simulated eLitmus verification (prototype)&quot;) and
          company domains are self-declared. The Plus upgrade modal is a{" "}
          <strong>mock paywall with no real payment</strong>.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-white">
          3. Respectful Conduct &amp; Reporting
        </h2>
        <p className="text-xs leading-relaxed">
          Harassment, impersonation, or spam is prohibited. Any user can report
          and block another user directly inside Chat, which immediately removes
          the match and blocks future matching between those accounts.
        </p>
      </section>
    </main>
  );
}
