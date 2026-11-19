import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-5 p-6 text-sm text-slate-300">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white">Privacy Policy</h1>
        <Link href="/" className="text-xs text-violet-400 hover:underline">
          &larr; Back to App
        </Link>
      </div>

      <p className="text-xs text-amber-300/90">
        Prototype notice: pHavelength is a student/candidate assignment
        prototype and does not constitute formal legal advice. A real launch
        requires professional legal review.
      </p>

      <section className="space-y-2">
        <h2 className="font-semibold text-white">1. What We Collect</h2>
        <p className="text-xs leading-relaxed">
          We collect only the information you explicitly enter during signup and
          onboarding: email address (via Supabase Auth), name, age (18+ check),
          gender, looking-for preference, city, self-declared batch/role/company
          domain/college, bio prompt, illustration avatar choice, and 5
          compatibility quiz answers, plus your chat messages and report/block
          actions.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-white">
          2. Purpose Limitation &amp; DPDP Consent
        </h2>
        <p className="text-xs leading-relaxed">
          Inspired by India&apos;s Digital Personal Data Protection (DPDP) Act,
          2023, your data is processed solely for generating curated daily
          matches, applying your Privacy Shield filters, and enabling in-app
          chat. Your consent is opt-in and stored with an explicit timestamp (
          <code>dpdp_consent_at</code>). We do not sell your data or connect to
          any live eLitmus candidate database in this prototype.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-white">
          3. Right to Erasure (Delete My Account)
        </h2>
        <p className="text-xs leading-relaxed">
          When signed in, you can permanently delete your account using the{" "}
          <strong>Delete My Account</strong> button in the footer. Deleting your
          account removes your Supabase Auth user and cascades to delete your
          profile, matches, messages, and reports from PostgreSQL.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-white">4. Known Prototype Limits</h2>
        <p className="text-xs leading-relaxed">
          For simplicity in this prototype, logged-in users can read profile
          rows for client-side matching, and photo blur is applied visually in
          CSS. A production release would move matching into a server-side
          function returning only safe fields and swap blurred image URLs on the
          server.
        </p>
      </section>
    </main>
  );
}
