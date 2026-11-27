import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Literata } from "next/font/google";
import IncomingCalls from "@/components/IncomingCalls";
import ModerationNotice from "@/components/ModerationNotice";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const literata = Literata({
  subsets: ["latin"],
  variable: "--font-literata",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maithri",
  description: "Where Connections Become Meaningful.",
};

const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("phavelength-theme")||"system";var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light");document.documentElement.setAttribute("data-theme-pref",s);}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolage.variable} ${literata.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col bg-fog font-sans text-ink antialiased">
        {process.env.NEXT_PUBLIC_LIVEKIT_URL && <IncomingCalls />}
        <ModerationNotice />
        <div className="flex-1">{children}</div>

        <footer className="border-t border-dusk/15 bg-fog">
          <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-3 px-4 py-6 text-left text-sm text-ink/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="font-medium text-ink">
                Maithri — Where Connections Become Meaningful.
              </p>
              <p className="mt-1 text-xs text-ink/75">
                Grievance contact:{" "}
                <Link
                  href="/grievance"
                  className="underline decoration-teal underline-offset-4 hover:text-dusk"
                >
                  grievance@phavelength-prototype.example
                </Link>
              </p>
            </div>

            <nav aria-label="Legal and safety links" className="flex flex-wrap gap-2">
              <Link
                href="/privacy"
                className="inline-flex min-h-[44px] items-center rounded px-3 text-sm text-ink underline-offset-4 hover:text-dusk hover:underline"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="inline-flex min-h-[44px] items-center rounded px-3 text-sm text-ink underline-offset-4 hover:text-dusk hover:underline"
              >
                Terms
              </Link>
              <Link
                href="/safety"
                className="inline-flex min-h-[44px] items-center rounded px-3 text-sm text-ink underline-offset-4 hover:text-dusk hover:underline"
              >
                Safety
              </Link>
              <Link
                href="/grievance"
                className="inline-flex min-h-[44px] items-center rounded px-3 text-sm text-ink underline-offset-4 hover:text-dusk hover:underline"
              >
                Grievance
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
