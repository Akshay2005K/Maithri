import Link from "next/link";
import BrandMark from "@/components/BrandMark";

export default function GrievancePage() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-dusk/15 bg-fog/80 backdrop-blur-md">
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
            <h1 className="text-2xl font-bold text-dusk">
              Grievance and safety contact
            </h1>
          </div>

          <section className="space-y-2 rounded-lg border border-dusk/20 bg-dusk/5 p-5 text-sm leading-relaxed text-ink">
            <p>
              <strong>Grievance officer (prototype placeholder):</strong> Akshay
              Kumar K
            </p>
            <p>
              <strong>Contact email:</strong>{" "}
              <code>grievance@phavelength-prototype.example</code>
            </p>
            <p>
              <strong>Acknowledgment target (production policy):</strong>{" "}
              Within 24 hours of receiving a safety, privacy, or data deletion
              grievance.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-semibold text-dusk">
              Immediate website actions
            </h2>
            <ul className="list-disc space-y-2 pl-5 font-serif text-sm leading-relaxed text-ink/90">
              <li>
                <strong>Safety or harassment:</strong> Use{" "}
                <strong>Report and block</strong> inside any Chat to immediately
                remove the match and prevent future contact.
              </li>
              <li>
                <strong>Data deletion:</strong> Use{" "}
                <strong>Delete account</strong> inside{" "}
                <strong>Menu → Profile</strong> (Edit profile) when signed in
                to erase your auth user, profile, matches, messages, and reports
                immediately.
              </li>
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
