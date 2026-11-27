"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [recovering, setRecovering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setRecovering(true);
        setError("");
      } else if (event === "SIGNED_OUT") {
        setRecovering(false);
      }
    });
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    if (hash.has("error") || query.has("error")) {
      setError("This reset link is invalid or expired. Request a new one below.");
    }
    return () => subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");

    if (recovering && (password.length < 6 || password !== confirmation)) {
      setError("Use at least six characters and enter the same password in both fields.");
      return;
    }

    setBusy(true);
    try {
      if (!recovering) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: new URL("/reset-password", window.location.origin).href,
        });
        if (resetError) {
          setError(resetError.status === 429
            ? "Too many requests. Wait a minute and try again."
            : "Could not send a reset link. Try again.");
          return;
        }
        setSent(true);
      } else {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) {
          setError(updateError.message);
          return;
        }
        setPassword("");
        setConfirmation("");
        setDone(true);
        const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
        if (signOutError) setError("Your password was updated. The current session could not be signed out.");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <section className="maithri-glass-card space-y-4 border border-dusk/20 bg-fog p-6">
        <h1 className="text-2xl font-semibold text-dusk">
          {done ? "Password updated" : recovering ? "Set a new password" : "Reset your password"}
        </h1>
        {error && <p role="alert" className="rounded bg-marigold/20 p-3 text-sm">{error}</p>}
        {done ? (
          <p role="status">You can now sign in with your new password.</p>
        ) : sent && !recovering ? (
          <p role="status">If an account exists for that email, we’ll send a reset link. Check your inbox and spam folder.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {recovering ? (
              <>
                <div>
                  <label htmlFor="reset-password" className="text-sm font-medium">New password</label>
                  <PasswordInput id="reset-password" autoComplete="new-password" required minLength={6}
                    value={password} onChange={(event) => setPassword(event.target.value)} />
                </div>
                <div>
                  <label htmlFor="reset-confirmation" className="text-sm font-medium">Confirm new password</label>
                  <PasswordInput id="reset-confirmation" autoComplete="new-password" required minLength={6}
                    value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="reset-email" className="text-sm font-medium">Account email</label>
                <input id="reset-email" type="email" autoComplete="email" required value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1.5 min-h-11 w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm" />
              </div>
            )}
            <button type="submit" disabled={busy}
              className="min-h-11 w-full rounded bg-dusk px-4 py-2 text-sm font-medium text-fog disabled:opacity-50">
              {recovering ? (busy ? "Saving…" : "Update password") : (busy ? "Sending…" : "Send reset link")}
            </button>
          </form>
        )}
        <Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-dusk underline">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
