"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, type Profile } from "@/lib/supabase";
import AuthForm from "@/components/AuthForm";
import Onboarding from "@/components/Onboarding";
import Quiz from "@/components/Quiz";

function isQuizComplete(profile: Profile | null): boolean {
  if (!profile) return false;
  return (
    profile.q1 !== null &&
    profile.q2 !== null &&
    profile.q3 !== null &&
    profile.q4 !== null &&
    profile.q5 !== null
  );
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingStep, setEditingStep] = useState<"onboarding" | "quiz" | null>(
    null
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) loadProfile(currentUser.id);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) loadProfile(currentUser.id);
      else {
        setProfile(null);
        setEditingStep(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    setProfile((data as Profile) ?? null);
    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return <main className="p-8 text-center text-sm">Loading session...</main>;
  }

  const needsOnboarding = !profile;
  const needsQuiz = profile && !isQuizComplete(profile);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white">pHavelength</h1>
          <p className="text-xs text-slate-400">
            Simulated eLitmus verification (prototype)
          </p>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-400 sm:inline">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
            >
              Sign Out
            </button>
          </div>
        )}
      </header>

      {!user ? (
        <AuthForm />
      ) : needsOnboarding || editingStep === "onboarding" ? (
        <Onboarding
          userId={user.id}
          existingProfile={profile}
          onComplete={(saved) => {
            setProfile(saved);
            setEditingStep(null);
          }}
        />
      ) : needsQuiz || editingStep === "quiz" ? (
        <Quiz
          profile={profile}
          onComplete={(updated) => {
            setProfile(updated);
            setEditingStep(null);
          }}
        />
      ) : (
        <div className="space-y-4 rounded-lg border border-emerald-800/60 bg-emerald-950/20 p-6">
          <div className="flex items-center gap-4">
            {profile.avatar_url && (
              <img
                src={profile.avatar_url}
                alt="Your avatar"
                className="h-14 w-14 rounded-xl border border-slate-700"
              />
            )}
            <div>
              <h2 className="text-lg font-semibold text-white">
                {profile.full_name}, {profile.age}
              </h2>
              <p className="text-xs text-slate-300">
                {profile.role_title || "Grad"} • {profile.city} • Batch{" "}
                {profile.batch}
              </p>
              <p className="mt-0.5 text-[11px] text-amber-300/90">
                Simulated eLitmus verification (prototype)
              </p>
            </div>
          </div>

          <div className="rounded border border-slate-800 bg-slate-900 p-4 text-xs text-slate-300 space-y-1">
            <p>
              <strong>DPDP Consent Recorded At:</strong>{" "}
              {new Date(profile.dpdp_consent_at).toLocaleString()}
            </p>
            <p>
              <strong>Privacy Shield:</strong> Hide same company (
              {profile.company_domain || "none"}):{" "}
              {profile.hide_same_company ? "ON" : "OFF"} | Hide same college (
              {profile.college_name || "none"}):{" "}
              {profile.hide_same_college ? "ON" : "OFF"}
            </p>
            <p>
              <strong>Quiz Vector (q1–q5):</strong> [{profile.q1}, {profile.q2},{" "}
              {profile.q3}, {profile.q4}, {profile.q5}]
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={() => setEditingStep("onboarding")}
              className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
            >
              Edit Profile &amp; Shield
            </button>
            <button
              onClick={() => setEditingStep("quiz")}
              className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
            >
              Retake Compatibility Quiz
            </button>
          </div>

          <p className="text-xs text-emerald-300">
            Phase 2 complete! Ready for Phase 3 (Seed users, Privacy Shield
            filtering, and Today&apos;s 3 Matches).
          </p>
        </div>
      )}
    </main>
  );
}
