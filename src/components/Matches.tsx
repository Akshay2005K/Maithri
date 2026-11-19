"use client";

import { useEffect, useState } from "react";
import {
  supabase,
  getRelationshipGoalLabel,
  type Profile,
} from "@/lib/supabase";
import {
  getOrCreateTodaysMatches,
  type MatchWithProfile,
} from "@/lib/matching";
import { getUnblurStatus, type UnblurStatus } from "@/lib/unblur";
import PaywallModal from "@/components/PaywallModal";
import WavePair from "@/components/WavePair";

interface MatchesProps {
  profile: Profile;
  onEditProfile: () => void;
  onRetakeQuiz: () => void;
  onOpenChat: (match: MatchWithProfile) => void;
  onProfileUpdated: (updated: Profile) => void;
}

export default function Matches({
  profile,
  onEditProfile,
  onRetakeQuiz,
  onOpenChat,
  onProfileUpdated,
}: MatchesProps) {
  const [todaysMatches, setTodaysMatches] = useState<MatchWithProfile[]>([]);
  const [earlierMatches, setEarlierMatches] = useState<MatchWithProfile[]>([]);
  const [unblurByMatch, setUnblurByMatch] = useState<Record<string, UnblurStatus>>(
    {}
  );
  const [hiddenCount, setHiddenCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getOrCreateTodaysMatches(profile);
        if (!active) return;

        const allMatchIds = [
          ...result.todaysMatches.map((m) => m.matchId),
          ...result.earlierMatches.map((m) => m.matchId),
        ];

        const statusMap: Record<string, UnblurStatus> = {};
        if (allMatchIds.length > 0) {
          const { data: msgRows } = await supabase
            .from("messages")
            .select("match_id, sender_id, content")
            .in("match_id", allMatchIds);

          for (const id of allMatchIds) {
            const matchMsgs = (msgRows ?? []).filter((m) => m.match_id === id);
            statusMap[id] = getUnblurStatus(matchMsgs);
          }
        }

        if (!active) return;
        setTodaysMatches(result.todaysMatches);
        setEarlierMatches(result.earlierMatches);
        setUnblurByMatch(statusMap);
        setHiddenCount(result.hiddenByShieldCount);
        setHasMore(result.hasMoreCandidates);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load matches.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [profile]);

  if (loading) {
    return (
      <div className="border-t border-dusk/15 py-8 text-left text-sm text-ink/80">
        Computing today&apos;s compatibility matches...
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Page Header & Controls */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-dusk/15 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-dusk">
            Today&apos;s curated matches ({todaysMatches.length}/
            {profile.is_plus_mock ? 4 : 3})
          </h1>
          <p className="mt-1 text-sm text-ink/80">
            Generated on open from your compatibility quiz and city (
            {profile.city}).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onEditProfile}
            className="inline-flex min-h-[44px] items-center rounded border border-dusk/25 bg-fog px-3.5 text-sm font-medium text-dusk hover:bg-dusk/10"
          >
            Edit profile and shield
          </button>
          <button
            type="button"
            onClick={onRetakeQuiz}
            className="inline-flex min-h-[44px] items-center rounded border border-dusk/25 bg-fog px-3.5 text-sm font-medium text-dusk hover:bg-dusk/10"
          >
            Retake quiz
          </button>
        </div>
      </div>

      {/* Privacy Shield Status */}
      <div className="rounded-lg border border-teal/40 bg-teal/10 px-4 py-3 text-sm text-ink">
        <strong>Privacy Shield:</strong> {hiddenCount}{" "}
        {hiddenCount === 1 ? "profile" : "profiles"} hidden by your Privacy
        Shield
        {profile.hide_same_company && profile.company_domain
          ? ` (company: ${profile.company_domain})`
          : ""}
        {profile.hide_same_college && profile.college_name
          ? ` (college: ${profile.college_name})`
          : ""}
        .
      </div>

      {profile.is_plus_mock && (
        <div className="rounded-lg border border-marigold bg-marigold/20 px-4 py-2.5 text-sm text-ink">
          <strong>Mock Plus active:</strong> fourth daily match slot unlocked
          (no payment).
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded border border-marigold bg-marigold/20 p-4 text-sm text-ink"
        >
          {error} Refresh the page to try loading your matches again.
        </p>
      )}

      {/* Full-width vertical list of matches */}
      {todaysMatches.length === 0 ? (
        <div className="rounded-lg border border-dusk/20 bg-dusk/5 p-6 text-left">
          <p className="text-sm text-ink">
            No eligible matches found right now in {profile.city} or nearby
            cities.
          </p>
          <p className="mt-1 text-sm text-ink/80">
            Update your looking-for preferences, city, or Privacy Shield
            settings to expand today&apos;s pool.
          </p>
          <button
            type="button"
            onClick={onEditProfile}
            className="mt-4 inline-flex min-h-[44px] items-center rounded bg-dusk px-4 text-sm font-medium text-fog hover:bg-dusk/90"
          >
            Update profile preferences
          </button>
        </div>
      ) : (
        <div className="divide-y divide-dusk/15 border-y border-dusk/15">
          {todaysMatches.map((item) => (
            <MatchRow
              key={item.matchId}
              item={item}
              unblur={unblurByMatch[item.matchId]}
              onOpenChat={() => onOpenChat(item)}
            />
          ))}
        </div>
      )}

      {/* Earlier Active Matches */}
      {earlierMatches.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-lg font-semibold text-dusk">
            Previous active matches
          </h2>
          <div className="divide-y divide-dusk/15 border-y border-dusk/15">
            {earlierMatches.map((item) => (
              <MatchRow
                key={item.matchId}
                item={item}
                unblur={unblurByMatch[item.matchId]}
                onOpenChat={() => onOpenChat(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4th Match Mock Paywall Trigger */}
      {!profile.is_plus_mock && todaysMatches.length >= 3 && (
        <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-marigold bg-marigold/15 p-5 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-dusk">
              Daily limit reached (3/3 free matches)
            </p>
            <p className="text-sm text-ink/85">
              {hasMore
                ? "A fourth compatible match is available today."
                : "Unlocking Plus raises your daily cap to 4 matches."}
            </p>
            <p className="text-xs font-medium text-ink/75">
              Mock paywall, no payment
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPaywall(true)}
            className="inline-flex min-h-[44px] shrink-0 items-center rounded bg-dusk px-4 py-2 text-sm font-medium text-fog hover:bg-dusk/90"
          >
            Unlock 4th daily match
          </button>
        </div>
      )}

      {showPaywall && (
        <PaywallModal
          profile={profile}
          onClose={() => setShowPaywall(false)}
          onUnlocked={(updated) => {
            setShowPaywall(false);
            onProfileUpdated(updated);
          }}
        />
      )}
    </section>
  );
}

function MatchRow({
  item,
  unblur,
  onOpenChat,
}: {
  item: MatchWithProfile;
  unblur?: UnblurStatus;
  onOpenChat: () => void;
}) {
  const { partner, compatibilityScore } = item;
  const blurClass = unblur?.blurClass ?? "blur-xl";
  const level = unblur?.level ?? 1;

  return (
    <article className="flex flex-col gap-5 py-6 md:flex-row md:items-center md:justify-between">
      {/* Left: Avatar + Identity + Bio */}
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-dusk/25 bg-dusk/10">
          <img
            src={partner.avatar_url || "/avatars/avatar-1.svg"}
            alt={`${partner.full_name} placeholder avatar`}
            className={`h-full w-full object-cover ${blurClass}`}
          />
          {level < 3 && (
            <span className="absolute inset-0 flex items-center justify-center bg-dusk/30 text-xs font-semibold text-fog">
              Level {level}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-lg font-semibold text-dusk">
              {partner.full_name}, {partner.age}
            </h3>
            <span className="text-sm text-ink/80">
              {partner.role_title || "Early-career graduate"} • {partner.city}{" "}
              • Batch {partner.batch}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-block rounded border border-marigold bg-marigold/20 px-2 py-0.5 text-xs font-medium text-ink">
              Simulated eLitmus verification (prototype)
            </span>
            {getRelationshipGoalLabel(partner.relationship_goal) && (
              <span className="inline-block rounded border border-teal/50 bg-teal/15 px-2 py-0.5 text-xs font-medium text-ink">
                {getRelationshipGoalLabel(partner.relationship_goal)}
              </span>
            )}
          </div>

          {partner.bio_prompt && (
            <p className="pt-1 font-serif text-sm leading-relaxed text-ink/90">
              &ldquo;{partner.bio_prompt}&rdquo;
            </p>
          )}

          {Array.isArray(partner.prompts) && partner.prompts.length > 0 && (
            <div className="space-y-2 pt-2">
              {partner.prompts.map((prompt) => (
                <div
                  key={prompt.key}
                  className="rounded border border-dusk/15 bg-dusk/5 px-3 py-2"
                >
                  <p className="text-xs font-semibold text-dusk">
                    {prompt.key}
                  </p>
                  <p className="mt-0.5 font-serif text-sm leading-relaxed text-ink/90">
                    {prompt.answer}
                  </p>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-ink/70">
            {unblur?.label ?? "Level 1 (Blurred)"}
          </p>
        </div>
      </div>

      {/* Right: WavePair + Open chat action */}
      <div className="flex flex-wrap items-center justify-between gap-4 md:shrink-0 md:flex-col md:items-end">
        <WavePair score={compatibilityScore} />
        <button
          type="button"
          onClick={onOpenChat}
          className="inline-flex min-h-[44px] items-center rounded bg-dusk px-4 py-2 text-sm font-medium text-fog hover:bg-dusk/90"
        >
          Open chat
        </button>
      </div>
    </article>
  );
}
