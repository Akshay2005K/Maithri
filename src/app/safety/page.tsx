import Link from "next/link";
import BrandMark from "@/components/BrandMark";

const SAFETY_TIPS = [
  {
    title: "Keep early conversations on Maithri",
    body: "Get to know your match through prompt replies and progressive unblur chat before moving to personal phone numbers or messaging apps.",
  },
  {
    title: "Never share financial details or send money",
    body: "Do not share bank details, UPI PINs, or one-time passwords, and never send money to someone you met online, regardless of the reason they give.",
  },
  {
    title: "Protect your personal and workplace boundaries",
    body: "Use the Privacy Shield to hide profiles from your company domain or college, and wait until you build real trust before sharing your exact home or office address.",
  },
  {
    title: "Meet in a busy public place",
    body: "For your first few meetups, pick a well-lit cafe, bookstore, or restaurant with other people around rather than a private residence or isolated spot.",
  },
  {
    title: "Share your meetup plan with a trusted friend",
    body: "Once a chat reaches Level 3 unblur, use Plan a meetup to copy a temporary check-in link showing your match's first name, the place, and the time for a friend or family member.",
  },
  {
    title: "Arrange your own transport",
    body: "Drive yourself, use public transit, or book your own cab to and from the meetup so you can leave comfortably whenever you choose.",
  },
  {
    title: "Trust your instincts and leave if something feels off",
    body: "If a match pressures you, disrespects your boundaries, or seems different from their profile, end the date early without hesitation.",
  },
  {
    title: "Use Report and block immediately",
    body: "If anyone behaves inappropriately in chat or in person, use Report and block inside chat to remove the match immediately, or reach out via our Grievance page.",
  },
];

export default function SafetyPage() {
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
            <h1 className="text-2xl font-bold text-dusk">Safety tips</h1>
            <p className="mt-1 text-sm text-ink/80">
              Practical guidelines for chatting and meeting safely on
              Maithri.
            </p>
          </div>

          <div className="space-y-4">
            {SAFETY_TIPS.map((tip) => (
              <section
                key={tip.title}
                className="space-y-1.5 rounded-lg border border-dusk/15 bg-dusk/5 p-4"
              >
                <h2 className="text-base font-semibold text-dusk">
                  {tip.title}
                </h2>
                <p className="font-serif text-sm leading-relaxed text-ink/90">
                  {tip.body}
                </p>
              </section>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
