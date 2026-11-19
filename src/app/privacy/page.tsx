import Link from "next/link";

export default function PrivacyPage() {
  return (
    <>
      <header className="border-b border-dusk/15 bg-fog">
        <div className="mx-auto flex min-h-[64px] w-full max-w-[1100px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex min-h-[44px] flex-col items-start justify-center"
          >
            <span className="text-xl font-bold tracking-tight text-dusk">
              pHavelength
            </span>
            <span className="text-xs text-ink/75">
              Simulated eLitmus verification (prototype)
            </span>
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
            <h1 className="text-2xl font-bold text-dusk">Privacy policy</h1>
          </div>

          <p className="rounded border border-marigold bg-marigold/20 p-3.5 text-xs leading-relaxed text-ink">
            Prototype notice: pHavelength is an assignment prototype and does
            not constitute formal legal advice. A real launch requires
            professional legal review.
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-dusk">
              What we collect
            </h2>
            <p className="font-serif text-sm leading-relaxed text-ink/90">
              We collect only the information you explicitly enter during signup
              and onboarding: email address (via Supabase Auth), name, age (18+
              check), gender, looking-for preference, city, self-declared batch,
              role, company domain, and college, bio prompt, illustration avatar
              choice, and five compatibility quiz answers, plus your chat
              messages and report or block actions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-dusk">
              Purpose limitation and DPDP consent
            </h2>
            <p className="font-serif text-sm leading-relaxed text-ink/90">
              Inspired by India&apos;s Digital Personal Data Protection (DPDP)
              Act, 2023, your data is processed solely for generating curated
              daily matches, applying your Privacy Shield filters, and enabling
              website chat. Your consent is opt-in and stored with an explicit
              timestamp (<code>dpdp_consent_at</code>). We do not sell your data
              or connect to any live eLitmus candidate database in this
              prototype.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-dusk">
              Shared meetup plan links
            </h2>
            <p className="font-serif text-sm leading-relaxed text-ink/90">
              When two unblurred matches create a meetup plan, the place name,
              date and time, and both participants&apos; first names are stored
              in <code>date_plans</code> and shared only by the link the user
              copies. Anyone who has that link can view those four details until
              the link expires 24 hours after the meetup time (or until either
              participant deletes the plan).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-dusk">
              Right to erasure (delete my account)
            </h2>
            <p className="font-serif text-sm leading-relaxed text-ink/90">
              When signed in, you can permanently delete your account using{" "}
              <strong>Delete my account</strong> at the bottom of the home page.
              Deleting your account removes your Supabase Auth user and cascades
              to delete your profile, matches, messages, and reports from
              PostgreSQL.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-dusk">
              Known prototype limits
            </h2>
            <p className="font-serif text-sm leading-relaxed text-ink/90">
              For simplicity in this prototype, logged-in users can read profile
              rows for client-side matching, and photo blur is applied visually
              in CSS. A production release would move matching into a
              server-side function returning only safe fields and swap blurred
              image sources on the server.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
