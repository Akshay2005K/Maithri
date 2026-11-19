"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, type Profile } from "@/lib/supabase";
import type { MatchWithProfile } from "@/lib/matching";
import AuthForm from "@/components/AuthForm";
import Onboarding from "@/components/Onboarding";
import Quiz from "@/components/Quiz";
import Matches from "@/components/Matches";
import Chat from "@/components/Chat";

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
  const [activeChat, setActiveChat] = useState<MatchWithProfile | null>(null);

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
        setActiveChat(null);
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
      ) : activeChat ? (
        <Chat
          currentUser={profile}
          matchId={activeChat.matchId}
          partner={activeChat.partner}
          compatibilityScore={activeChat.compatibilityScore}
          onBack={() => setActiveChat(null)}
          onBlocked={() => setActiveChat(null)}
        />
      ) : (
        <Matches
          profile={profile}
          onEditProfile={() => setEditingStep("onboarding")}
          onRetakeQuiz={() => setEditingStep("quiz")}
          onOpenChat={(match) => setActiveChat(match)}
        />
      )}
    </main>
  );
}
