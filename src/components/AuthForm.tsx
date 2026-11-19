"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const DEMO_ACCOUNTS = [
  { label: "Demo 1 (Aarav)", email: "aarav@elitmus-demo.in" },
  { label: "Demo 2 (Anya)", email: "anya@elitmus-demo.in" },
];

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("Account created! You are now signed in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
    }

    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-1 text-lg font-semibold text-white">
          {isSignUp ? "Create an Account" : "Sign In"}
        </h2>
        <p className="mb-4 text-xs text-amber-300/90">
          Simulated eLitmus verification (prototype)
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              placeholder="At least 6 characters"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
          {message && <p className="text-xs text-emerald-400">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setMessage(null);
          }}
          className="mt-4 w-full text-center text-xs text-violet-400 hover:underline"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Need an account? Sign up"}
        </button>
      </div>

      {/* Demo Credentials Box for Evaluators (Section 6) */}
      {!isSignUp && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-300">
          <p className="font-semibold text-white">Evaluator Demo Accounts</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Shared password: <code className="text-slate-200">elitmus2026</code>
          </p>
          <div className="mt-2.5 flex gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword("elitmus2026");
                }}
                className="flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-violet-300 hover:border-violet-500"
              >
                Fill {acc.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Aarav &amp; Anya share a pre-seeded match; Divya shares Aarav&apos;s
            company (<code>flipkart.com</code>) to demonstrate the Privacy
            Shield.
          </p>
        </div>
      )}
    </div>
  );
}
