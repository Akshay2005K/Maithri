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
              We collect only the information you explicitly enter during signup,
              onboarding, and profile editing:
            </p>
            <ul className="list-disc space-y-1.5 pl-5 font-serif text-sm leading-relaxed text-ink/90">
              <li>
                <strong>Required account and profile fields:</strong> email
                address (verified via Supabase Auth OTP), first/full name, birth
                date (<code>birth_date</code>, used to derive your displayed age
                and verify that you are 18 or older), gender (<code>man</code>,{" "}
                <code>woman</code>, or <code>beyond_binary</code>),
                interested-in preference (<code>men</code>, <code>women</code>,{" "}
                <code>beyond_binary</code>, or <code>everyone</code>),
                relationship goal (<code>looking_for</code>), city, two to three
                profile prompts, illustration avatar choice, five compatibility
                quiz answers (<code>q1</code>–<code>q5</code>), and timestamps
                for DPDP consent (<code>dpdp_consent_at</code>) and house rules
                acceptance (<code>house_rules_accepted_at</code>).
              </li>
              <li>
                <strong>Self-declared work, plan, and Privacy Shield fields:</strong>{" "}
                batch year, role title, self-declared company domain, college
                name, your two Privacy Shield toggles, and your current
                prototype plan tier (<code>profiles.plan</code>: Free, Plus, or
                Pro).
              </li>
              <li>
                <strong>
                  Optional profile details (<code>profiles.details</code>):
                </strong>{" "}
                interests (up to 6), languages spoken (up to 5), open to,
                zodiac sign, education level, communication style, love style,
                pets, drinking, smoking, and workout frequency. Every optional
                detail can be cleared at any time and none of the optional{" "}
                <code>details</code> fields are used in matching or
                compatibility scoring.
              </li>
              <li>
                <strong>Activity and browser-only preferences:</strong> your
                chat messages, optional meetup plan links, report or block
                actions, and your display theme preference (stored locally in
                your browser&apos;s <code>localStorage</code> under{" "}
                <code>phavelength-theme</code>, never sent to the database).
              </li>
            </ul>
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
              Voice and video calling (LiveKit Cloud)
            </h2>
            <p className="font-serif text-sm leading-relaxed text-ink/90">
              1-on-1 voice and video calls run through a third-party real-time
              provider (<strong>LiveKit Cloud, EU region</strong>). pHavelength
              does not record or store call audio or video content. Call
              metadata—who participated, when the call occurred, how long it
              lasted, and the call mode (voice or video)—is stored in{" "}
              <code>calls</code>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-dusk">
              Plan payments (Cashfree Sandbox)
            </h2>
            <p className="font-serif text-sm leading-relaxed text-ink/90">
              Plan upgrades are processed by <strong>Cashfree</strong>{" "}
              (currently in test/sandbox mode; no real money is charged). We
              store your order ID (<code>cashfree_order_id</code>), purchased
              plan, amount, and payment status in <code>payments</code>. We
              never store card or UPI details. Cashfree receives your verified
              email address and an internal user ID (plus a fixed dummy phone
              number in sandbox mode).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-dusk">
              Right to erasure (delete my account)
            </h2>
            <p className="font-serif text-sm leading-relaxed text-ink/90">
              When signed in, you can permanently delete your account using{" "}
              <strong>Delete account</strong> inside{" "}
              <strong>Menu → Profile</strong> (Edit profile). Deleting your
              account removes your Supabase Auth user and cascades to delete your
              profile, matches, messages, and reports from PostgreSQL.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-dusk">
              Known prototype limits
            </h2>
            <p className="font-serif text-sm leading-relaxed text-ink/90">
              Matching runs on the server and returns only safe display fields
              (each user&apos;s full profile row is readable only by its owner).
              Photo blur is applied visually in CSS on placeholder illustration
              avatars; a production launch using real photos would store
              pre-blurred files and swap signed URLs on the server.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
