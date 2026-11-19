"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  supabase,
  RELATIONSHIP_GOALS,
  type Profile,
  type RelationshipGoal,
} from "@/lib/supabase";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const candidateUser = session?.user ?? null;
      const confirmedUser = candidateUser?.email_confirmed_at
        ? candidateUser
        : null;
      setUser(confirmedUser);
      if (confirmedUser) loadProfile(confirmedUser.id);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const candidateUser = session?.user ?? null;
      const confirmedUser = candidateUser?.email_confirmed_at
        ? candidateUser
        : null;
      setUser(confirmedUser);
      if (confirmedUser) loadProfile(confirmedUser.id);
      else {
        setProfile(null);
        setEditingStep(null);
        setActiveChat(null);
        setConfirmDelete(false);
        setMobileMenuOpen(false);
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

  async function handleDeleteAccount() {
    setDeleteError(null);
    setDeleting(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setDeleteError("No active session found. Sign in again and retry.");
      setDeleting(false);
      return;
    }

    const res = await fetch("/api/delete-account", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setDeleteError(body.error || "Could not delete account. Please try again.");
      setDeleting(false);
      return;
    }

    await supabase.auth.signOut();
    setDeleting(false);
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[1100px] px-4 py-12 text-left text-sm text-ink sm:px-6">
        Loading your session...
      </main>
    );
  }

  const needsOnboarding = !profile;
  const needsQuiz = profile && !isQuizComplete(profile);
  const needsGoal = Boolean(profile && !profile.relationship_goal);
  const canNavigateMain = Boolean(
    user && !needsOnboarding && !needsQuiz && !needsGoal
  );

  return (
    <>
      <header className="border-b border-dusk/15 bg-fog">
        <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6">
          <nav
            aria-label="Primary navigation"
            className="flex min-h-[64px] items-center justify-between gap-4"
          >
            <button
              type="button"
              onClick={() => {
                setEditingStep(null);
                setActiveChat(null);
                setMobileMenuOpen(false);
              }}
              className="flex min-h-[44px] flex-col items-start justify-center text-left"
            >
              <span className="text-xl font-bold tracking-tight text-dusk">
                pHavelength
              </span>
              <span className="text-xs text-ink/75">
                Simulated eLitmus verification (prototype)
              </span>
            </button>

            {user && (
              <>
                <button
                  type="button"
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-nav-menu"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded border border-dusk/25 px-3 text-sm font-medium text-dusk sm:hidden"
                >
                  {mobileMenuOpen ? "Close" : "Menu"}
                </button>

                <div className="hidden items-center gap-2 sm:flex">
                  {canNavigateMain && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStep(null);
                          setActiveChat(null);
                        }}
                        className={`inline-flex min-h-[44px] items-center rounded px-3 text-sm font-medium ${
                          editingStep === null && activeChat === null
                            ? "bg-dusk text-fog"
                            : "text-ink hover:bg-dusk/10"
                        }`}
                      >
                        Matches
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveChat(null);
                          setEditingStep("onboarding");
                        }}
                        className={`inline-flex min-h-[44px] items-center rounded px-3 text-sm font-medium ${
                          editingStep === "onboarding"
                            ? "bg-dusk text-fog"
                            : "text-ink hover:bg-dusk/10"
                        }`}
                      >
                        Edit profile
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="inline-flex min-h-[44px] items-center rounded border border-dusk/25 px-3 text-sm font-medium text-dusk hover:bg-dusk/10"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </nav>

          {user && mobileMenuOpen && (
            <div
              id="mobile-nav-menu"
              className="flex flex-col gap-1 border-t border-dusk/15 py-3 sm:hidden"
            >
              {canNavigateMain && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStep(null);
                      setActiveChat(null);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex min-h-[44px] w-full items-center rounded px-3 text-left text-sm font-medium ${
                      editingStep === null && activeChat === null
                        ? "bg-dusk text-fog"
                        : "text-ink"
                    }`}
                  >
                    Matches
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveChat(null);
                      setEditingStep("onboarding");
                      setMobileMenuOpen(false);
                    }}
                    className={`flex min-h-[44px] w-full items-center rounded px-3 text-left text-sm font-medium ${
                      editingStep === "onboarding"
                        ? "bg-dusk text-fog"
                        : "text-ink"
                    }`}
                  >
                    Edit profile
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex min-h-[44px] w-full items-center rounded px-3 text-left text-sm font-medium text-dusk"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1100px] px-4 py-8 text-left sm:px-6">
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
        ) : needsGoal ? (
          <MissingGoalPrompt
            profile={profile}
            onSaved={(updated) => setProfile(updated)}
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
            onProfileUpdated={(updated) => setProfile(updated)}
          />
        )}

        {/* DPDP Right to Erasure: Delete my account */}
        {user && (
          <section className="mt-12 border-t border-dusk/15 pt-6">
            {!confirmDelete ? (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink/80">
                <span>Need to remove your account and stored data?</span>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex min-h-[44px] items-center rounded px-3 text-sm font-medium text-dusk underline decoration-marigold underline-offset-4 hover:bg-marigold/15"
                >
                  Delete my account
                </button>
              </div>
            ) : (
              <div className="space-y-3 rounded-lg border border-marigold bg-marigold/15 p-5 text-sm text-ink">
                <p className="font-semibold text-dusk">
                  Confirm permanent account deletion
                </p>
                <p className="text-ink/90">
                  This deletes your Supabase Auth user and removes your profile,
                  matches, messages, and reports. If you are testing with a
                  seeded demo account, create a fresh signup instead so demo
                  accounts stay intact.
                </p>
                {deleteError && (
                  <p className="font-medium text-dusk">{deleteError}</p>
                )}
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={handleDeleteAccount}
                    className="inline-flex min-h-[44px] items-center rounded bg-dusk px-4 text-sm font-medium text-fog disabled:opacity-50"
                  >
                    {deleting ? "Deleting account..." : "Delete permanently"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="inline-flex min-h-[44px] items-center rounded border border-dusk/25 bg-fog px-4 text-sm font-medium text-ink"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}

function MissingGoalPrompt({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved: (updated: Profile) => void;
}) {
  const [goal, setGoal] = useState<RelationshipGoal | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSaveGoal(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!goal) {
      setError("Pick a relationship goal above before viewing matches.");
      return;
    }

    setSaving(true);
    const { data, error: dbErr } = await supabase
      .from("profiles")
      .update({ relationship_goal: goal })
      .eq("id", profile.id)
      .select()
      .single();
    setSaving(false);

    if (dbErr) {
      setError(`${dbErr.message} Please try saving again.`);
      return;
    }

    onSaved(data as Profile);
  }

  return (
    <section className="mx-auto w-full max-w-[640px]">
      <form
        onSubmit={handleSaveGoal}
        className="space-y-5 rounded-lg border border-dusk/20 bg-fog p-6 sm:p-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-dusk">
            Pick your relationship goal
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/85">
            Before seeing matches, let us know what you are looking for right
            now. We use this to align daily matches.
          </p>
        </div>

        <fieldset className="space-y-2.5">
          <legend className="text-sm font-medium text-ink">
            What are you looking for?
          </legend>
          <div className="space-y-2">
            {RELATIONSHIP_GOALS.map((option) => (
              <label
                key={option.key}
                htmlFor={`missing-goal-${option.key}`}
                className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded border px-3.5 py-2 text-sm ${
                  goal === option.key
                    ? "border-dusk bg-dusk font-medium text-fog"
                    : "border-dusk/25 bg-fog text-ink hover:bg-dusk/5"
                }`}
              >
                <input
                  id={`missing-goal-${option.key}`}
                  type="radio"
                  name="missing_relationship_goal"
                  value={option.key}
                  checked={goal === option.key}
                  onChange={() => setGoal(option.key)}
                  className="h-4 w-4 shrink-0 accent-teal"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && (
          <p
            role="alert"
            className="rounded border border-marigold bg-marigold/20 p-3 text-xs font-medium text-ink"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="min-h-[44px] w-full rounded bg-dusk px-4 py-2.5 text-sm font-medium text-fog hover:bg-dusk/90 disabled:opacity-50"
        >
          {saving ? "Saving goal..." : "Save goal and see matches"}
        </button>
      </form>
    </section>
  );
}
