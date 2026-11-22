"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  supabase,
  RELATIONSHIP_GOALS,
  type Profile,
  type RelationshipGoal,
} from "@/lib/supabase";
import type { MatchWithProfile } from "@/lib/matching";
import { getEffectivePlan } from "@/lib/entitlements";
import AuthForm from "@/components/AuthForm";
import Onboarding from "@/components/Onboarding";
import Quiz from "@/components/Quiz";
import Matches from "@/components/Matches";
import Chat from "@/components/Chat";
import ProfileSettings from "@/components/ProfileSettings";
import HouseRulesModal from "@/components/HouseRulesModal";

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
  const [showProfileView, setShowProfileView] = useState(false);
  const [activeChat, setActiveChat] = useState<MatchWithProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingHouseRulesAt, setPendingHouseRulesAt] = useState<string | null>(
    null
  );
  const [savingHouseRules, setSavingHouseRules] = useState(false);
  const [houseRulesError, setHouseRulesError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("view") === "profile") {
        setShowProfileView(true);
      }
    }

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
        setShowProfileView(false);
        setActiveChat(null);
        setMenuOpen(false);
        setPendingHouseRulesAt(null);
        setHouseRulesError(null);
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

  async function handleAcceptHouseRules() {
    setHouseRulesError(null);
    const now = new Date().toISOString();

    if (!profile) {
      // Brand-new user: store in component state until Onboarding creates the profile row
      setPendingHouseRulesAt(now);
      return;
    }

    setSavingHouseRules(true);
    const { data, error: dbErr } = await supabase
      .from("profiles")
      .update({ house_rules_accepted_at: now })
      .eq("id", profile.id)
      .select()
      .single();
    setSavingHouseRules(false);

    if (dbErr) {
      setHouseRulesError(`${dbErr.message} Please try again.`);
      return;
    }

    setProfile(data as Profile);
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
  const needsHouseRules = Boolean(
    user && (profile ? !profile.house_rules_accepted_at : !pendingHouseRulesAt)
  );
  const canNavigateMain = Boolean(
    user && !needsOnboarding && !needsQuiz && !needsGoal
  );

  return (
    <>
      <header className="border-b border-dusk/15 bg-fog">
        <div className="relative mx-auto w-full max-w-[1100px] px-4 sm:px-6">
          <nav
            aria-label="Primary navigation"
            className="flex min-h-[64px] items-center justify-between gap-4"
          >
            <button
              type="button"
              onClick={() => {
                setShowProfileView(false);
                setActiveChat(null);
                setMenuOpen(false);
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

            {user ? (
              <div className="flex items-center gap-2">
                {canNavigateMain && (
                  <Link
                    href="/upgrade"
                    className="hidden min-h-[44px] items-center rounded border border-dusk/25 bg-fog px-3.5 text-sm font-medium text-dusk transition-colors hover:bg-dusk/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2 motion-reduce:transition-none sm:inline-flex"
                  >
                    {getEffectivePlan(profile?.plan, profile?.plan_expires_at) ===
                    "pro"
                      ? "Plans"
                      : "Upgrade"}
                  </Link>
                )}
                <button
                  type="button"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                  aria-controls="user-menu-dropdown"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded border px-3 ${
                    menuOpen || showProfileView
                      ? "border-dusk bg-dusk text-fog"
                      : "border-dusk/25 bg-fog text-dusk hover:bg-dusk/10"
                  }`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                  </svg>
                </button>
              </div>
            ) : (
              <Link
                href="/settings"
                className="inline-flex min-h-[44px] items-center rounded border border-dusk/25 bg-fog px-3.5 text-sm font-medium text-dusk hover:bg-dusk/10"
              >
                Settings
              </Link>
            )}
          </nav>

          {user && menuOpen && (
            <div
              id="user-menu-dropdown"
              className="flex flex-col gap-1 border-t border-dusk/15 py-3 sm:absolute sm:right-6 sm:top-[64px] sm:z-40 sm:w-64 sm:rounded-b-lg sm:border sm:border-dusk/20 sm:bg-fog sm:p-2"
            >
              <div className="mb-1 border-b border-dusk/15 px-3 pb-2 text-left">
                {profile?.full_name && (
                  <p className="truncate text-sm font-semibold text-dusk">
                    {profile.full_name}
                  </p>
                )}
                <p className="truncate text-xs text-ink/75">{user.email}</p>
              </div>
              {canNavigateMain && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveChat(null);
                    setShowProfileView(true);
                    setMenuOpen(false);
                  }}
                  className={`flex min-h-[44px] w-full items-center rounded px-3 text-left text-sm font-medium ${
                    showProfileView
                      ? "bg-dusk text-fog"
                      : "text-ink hover:bg-dusk/10"
                  }`}
                >
                  Profile
                </button>
              )}
              <Link
                href="/upgrade"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] w-full items-center rounded px-3 text-left text-sm font-medium text-ink hover:bg-dusk/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2"
              >
                {getEffectivePlan(profile?.plan, profile?.plan_expires_at) ===
                "pro"
                  ? "Plans"
                  : "Upgrade"}
              </Link>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] w-full items-center rounded px-3 text-left text-sm font-medium text-ink hover:bg-dusk/10"
              >
                Settings
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  handleSignOut();
                }}
                className="flex min-h-[44px] w-full items-center rounded px-3 text-left text-sm font-medium text-dusk hover:bg-marigold/20"
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
        ) : needsOnboarding ? (
          <Onboarding
            userId={user.id}
            userEmail={user.email ?? ""}
            existingProfile={profile}
            houseRulesAcceptedAt={pendingHouseRulesAt}
            onComplete={(saved) => setProfile(saved)}
            onSignOut={handleSignOut}
          />
        ) : needsQuiz ? (
          <Quiz
            profile={profile}
            onComplete={(updated) => setProfile(updated)}
          />
        ) : needsGoal ? (
          <MissingGoalPrompt
            profile={profile}
            onSaved={(updated) => setProfile(updated)}
          />
        ) : showProfileView ? (
          <ProfileSettings
            profile={profile}
            userEmail={user.email ?? ""}
            onSaved={(updated) => {
              setProfile(updated);
              setShowProfileView(false);
            }}
            onProfileQuietUpdate={(updated) => setProfile(updated)}
            onCancel={() => setShowProfileView(false)}
            onDeleteAccount={handleDeleteAccount}
            deleting={deleting}
            deleteError={deleteError}
          />
        ) : activeChat ? (
          <Chat
            currentUser={profile}
            matchId={activeChat.matchId}
            partner={activeChat.partner}
            compatibilityScore={activeChat.compatibilityScore}
            breakdown={activeChat.breakdown}
            unmatchedByPartner={activeChat.unmatchedByPartner}
            closureReason={activeChat.closureReason}
            onBack={() => setActiveChat(null)}
            onBlocked={() => setActiveChat(null)}
          />
        ) : (
          <Matches
            profile={profile}
            onEditProfile={() => setShowProfileView(true)}
            onOpenChat={(match) => setActiveChat(match)}
            onProfileUpdated={(updated) => setProfile(updated)}
          />
        )}

        {needsHouseRules && (
          <HouseRulesModal
            onAgree={handleAcceptHouseRules}
            onSignOut={handleSignOut}
            saving={savingHouseRules}
            error={houseRulesError}
          />
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
