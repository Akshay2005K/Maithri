import Link from "next/link";

export default function GrievancePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-5 p-6 text-sm text-slate-300">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white">
          Grievance &amp; Safety Contact
        </h1>
        <Link href="/" className="text-xs text-violet-400 hover:underline">
          &larr; Back to App
        </Link>
      </div>

      <section className="space-y-2 rounded-lg border border-slate-800 bg-slate-900 p-5 text-xs leading-relaxed">
        <p>
          <strong>Grievance Officer (Prototype Placeholder):</strong> Akshay
          Kumar K
        </p>
        <p>
          <strong>Contact Email:</strong>{" "}
          <code>grievance@phavelength-prototype.example</code>
        </p>
        <p>
          <strong>Acknowledgment Target (Production Policy):</strong> Within 24
          hours of receiving a safety, privacy, or data deletion grievance.
        </p>
      </section>

      <section className="space-y-2 text-xs leading-relaxed">
        <h2 className="font-semibold text-white">Immediate In-App Actions</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Safety or Harassment:</strong> Use the{" "}
            <strong>Report / Block</strong> button inside any Chat to
            immediately remove the match and prevent future contact.
          </li>
          <li>
            <strong>Data Deletion:</strong> Use the{" "}
            <strong>Delete My Account</strong> button in the app footer when
            logged in to erase your auth user, profile, matches, messages, and
            reports immediately.
          </li>
        </ul>
      </section>
    </main>
  );
}
