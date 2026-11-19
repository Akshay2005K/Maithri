"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import WavePair from "@/components/WavePair";

const DEMO_ACCOUNTS = [
  { label: "Demo 1 (Aarav)", email: "aarav@elitmus-demo.in" },
  { label: "Demo 2 (Anya)", email: "anya@elitmus-demo.in" },
];

function formatOtpError(rawMessage: string): string {
  const lower = rawMessage.toLowerCase();
  if (
    lower.includes("rate limit") ||
    lower.includes("too many") ||
    lower.includes("429") ||
    lower.includes("for security purposes")
  ) {
    return "Too many requests. Wait 60 seconds before trying again or requesting a new code.";
  }
  if (lower.includes("expired")) {
    return "That verification code has expired. Click Resend code to receive a fresh verification code.";
  }
  if (
    lower.includes("invalid") ||
    lower.includes("token") ||
    lower.includes("otp")
  ) {
    return "That code is wrong. Check the latest verification code in your email or spam folder and try again.";
  }
  return `${rawMessage} Check the code or click Resend code to try again.`;
}

function formatAuthError(rawMessage: string): string {
  const lower = rawMessage.toLowerCase();
  if (
    lower.includes("rate limit") ||
    lower.includes("too many") ||
    lower.includes("429") ||
    lower.includes("for security purposes")
  ) {
    return "Too many requests. Wait 60 seconds and try again.";
  }
  return `${rawMessage} Check your email and password and try again.`;
}

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const trimmedEmail = email.trim();

    if (isSignUp) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (signUpError) {
        setError(formatAuthError(signUpError.message));
      } else if (
        data.user &&
        data.user.identities &&
        data.user.identities.length === 0
      ) {
        setError(
          "An account with this email already exists. Switch to Sign in instead."
        );
      } else {
        setOtpStep(true);
        setOtp("");
        setCooldown(60);
        setMessage(`We emailed a verification code to ${trimmedEmail}.`);
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (signInError) {
        if (signInError.message.toLowerCase().includes("email not confirmed")) {
          setOtpStep(true);
          setOtp("");
          setCooldown(0);
          setMessage(
            `Your email (${trimmedEmail}) is not confirmed yet. Enter the verification code below or click Resend code.`
          );
        } else {
          setError(formatAuthError(signInError.message));
        }
      }
    }

    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const cleanedToken = otp.trim();
    if (!/^\d{6,8}$/.test(cleanedToken)) {
      setError(
        "Enter the full verification code from your email (6 to 8 digits) and try again."
      );
      return;
    }

    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: cleanedToken,
      type: "signup",
    });
    setLoading(false);

    if (verifyError) {
      setError(formatOtpError(verifyError.message));
    }
  }

  async function handleResendCode() {
    if (cooldown > 0 || resending) return;
    setError(null);
    setMessage(null);
    setResending(true);

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
    });

    setResending(false);

    if (resendError) {
      setError(formatOtpError(resendError.message));
      return;
    }

    setCooldown(60);
    setMessage(`A fresh verification code was sent to ${email.trim()}.`);
  }

  return (
    <section className="grid grid-cols-1 gap-10 py-4 md:grid-cols-12 md:items-start md:py-8">
      {/* Left column: Hero headline, one-sentence explanation, static WavePair */}
      <div className="space-y-6 md:col-span-7">
        <p className="inline-block rounded border border-marigold bg-marigold/20 px-3 py-1 text-xs font-medium text-ink">
          Simulated eLitmus verification (prototype)
        </p>

        <h1 className="text-3xl font-bold leading-tight tracking-tight text-dusk sm:text-4xl">
          Three curated matches a day, never a swipe deck.
        </h1>

        <p className="max-w-xl font-serif text-base leading-relaxed text-ink/90 sm:text-lg">
          Built for early-career graduates who want real conversations before
          seeing photos and a privacy shield that keeps coworkers out of your
          feed.
        </p>

        <div className="rounded-lg border border-dusk/15 bg-fog p-5">
          <WavePair
            score={92}
            label="92% compatibility — aligned waves mean shared values"
            size="lg"
          />
        </div>
      </div>

      {/* Right column: Sign in / Sign up / OTP verification + demo credentials */}
      <div className="space-y-5 md:col-span-5">
        <div className="rounded-lg border border-dusk/20 bg-fog p-6">
          {otpStep ? (
            <>
              <h2 className="text-xl font-semibold text-dusk">
                Enter the verification code we emailed you
              </h2>
              <p className="mt-1 text-xs text-ink/75">
                Verification for <strong>{email.trim()}</strong>
              </p>

              <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="auth-otp"
                    className="block text-sm font-medium text-ink"
                  >
                    Email verification code
                  </label>
                  <input
                    id="auth-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    required
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))
                    }
                    className="mt-1.5 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-base tracking-widest text-ink placeholder:tracking-normal placeholder:text-ink/50"
                    placeholder="Enter 6–8 digit code"
                  />
                  <p className="mt-1.5 text-xs text-ink/75">
                    Didn&apos;t get it? Check your spam folder.
                  </p>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded border border-marigold bg-marigold/20 p-3 text-xs font-medium text-ink"
                  >
                    {error}
                  </p>
                )}
                {message && (
                  <p className="rounded border border-teal bg-teal/15 p-3 text-xs font-medium text-ink">
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-[44px] w-full rounded bg-dusk px-4 py-2.5 text-sm font-medium text-fog hover:bg-dusk/90 disabled:opacity-50"
                >
                  {loading ? "Verifying code..." : "Verify email"}
                </button>
              </form>

              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={cooldown > 0 || resending}
                  onClick={handleResendCode}
                  className="min-h-[44px] w-full rounded border border-dusk/25 bg-fog px-4 py-2 text-sm font-medium text-dusk hover:bg-dusk/10 disabled:opacity-50"
                >
                  {resending
                    ? "Sending code..."
                    : cooldown > 0
                      ? `Resend code (${cooldown}s)`
                      : "Resend code"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpStep(false);
                    setOtp("");
                    setError(null);
                    setMessage(null);
                  }}
                  className="flex min-h-[44px] w-full items-center justify-center rounded text-sm font-medium text-dusk underline decoration-teal underline-offset-4 hover:bg-dusk/5"
                >
                  Back to sign in
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-dusk">
                {isSignUp ? "Create an account" : "Sign in"}
              </h2>
              <p className="mt-1 text-xs text-ink/75">
                Simulated eLitmus verification (prototype)
              </p>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="auth-email"
                    className="block text-sm font-medium text-ink"
                  >
                    Email
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink placeholder:text-ink/50"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="auth-password"
                    className="block text-sm font-medium text-ink"
                  >
                    Password
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink placeholder:text-ink/50"
                    placeholder="At least 6 characters"
                  />
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded border border-marigold bg-marigold/20 p-3 text-xs font-medium text-ink"
                  >
                    {error}
                  </p>
                )}
                {message && (
                  <p className="rounded border border-teal bg-teal/15 p-3 text-xs font-medium text-ink">
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-[44px] w-full rounded bg-dusk px-4 py-2.5 text-sm font-medium text-fog hover:bg-dusk/90 disabled:opacity-50"
                >
                  {loading
                    ? isSignUp
                      ? "Sending code..."
                      : "Signing in..."
                    : isSignUp
                      ? "Create account"
                      : "Sign in"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setMessage(null);
                }}
                className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded text-sm font-medium text-dusk underline decoration-teal underline-offset-4 hover:bg-dusk/5"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Need an account? Sign up"}
              </button>
            </>
          )}
        </div>

        {/* Evaluator demo credentials box */}
        {!isSignUp && !otpStep && (
          <div className="rounded-lg border border-dusk/15 bg-dusk/5 p-5 text-sm text-ink">
            <h3 className="font-semibold text-dusk">Evaluator demo accounts</h3>
            <p className="mt-1 text-xs text-ink/80">
              Shared password: <code>elitmus2026</code>
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword("elitmus2026");
                  }}
                  className="min-h-[44px] flex-1 rounded border border-dusk/25 bg-fog px-3 py-2 text-xs font-medium text-dusk hover:bg-teal/15"
                >
                  Use {acc.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink/80">
              Aarav and Anya share a pre-seeded match; Divya shares Aarav&apos;s
              company (<code>flipkart.com</code>) to test the Privacy Shield.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
