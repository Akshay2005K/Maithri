import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "pHavelength (Prototype)",
  description: "Dating app prototype for early-career professionals",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-slate-950 text-slate-100 antialiased">
        <div className="flex-1">{children}</div>
        <footer className="mx-auto w-full max-w-2xl border-t border-slate-800 px-6 py-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              pHavelength (Prototype) • Grievance:{" "}
              <Link href="/grievance" className="text-violet-400 hover:underline">
                grievance@phavelength-prototype.example
              </Link>
            </span>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-white hover:underline">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white hover:underline">
                Terms
              </Link>
              <Link
                href="/grievance"
                className="hover:text-white hover:underline"
              >
                Grievance Contact
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
