"use client";

import { useEffect, useState } from "react";
import { supabase, type Profile } from "@/lib/supabase";
import {
  getOrCreateTodaysMatches,
  type MatchWithProfile,
} from "@/lib/matching";
import { getUnblurStatus, type UnblurStatus } from "@/lib/unblur";

interface MatchesProps {
  profile: Profile;
  onEditProfile: () => void;
  onRetakeQuiz: () => void;
  onOpenChat: (match: MatchWithProfile) => void;
}

export default function Matches({
  profile,
  onEditProfile,
  onRetakeQuiz,
  onOpenChat,
}: MatchesProps) {
  const [todaysMatches, setTodaysMatches] = useState<MatchWithProfile[]>([]);
  const [earlierMatches, setEarlierMatches] = useState<MatchWithProfile[]>([]);
  const [unblurByMatch, setUnblurByMatch] = useState<Record<string, UnblurStatus>>(
    {}
  );
  const [hiddenCount, setHiddenCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
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
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 text-center text-sm text-slate-300">
        Computing today&apos;s compatibility matches...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Status & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div>
          <h2 className="text-base font-semibold text-white">
            Today&apos;s Curated Matches ({todaysMatches.length}/
            {profile.is_plus_mock ? 4 : 3})
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            No swipe deck. Generated on open from your 5-question quiz and city
            ({profile.city}).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEditProfile}
            className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            Edit Profile / Shield
          </button>
          <button
            onClick={onRetakeQuiz}
            className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            Retake Quiz
          </button>
        </div>
      </div>

      {/* Privacy Shield Counter */}
      <div className="rounded-lg border border-violet-800/50 bg-violet-950/30 px-4 py-3 text-xs text-violet-200">
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

      {error && (
        <p className="rounded border border-red-800 bg-red-950/40 p-3 text-xs text-red-300">
          {error}
        </p>
      )}

      {/* Match Cards */}
      {todaysMatches.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 text-center text-sm text-slate-400">
          No eligible matches found right now in {profile.city} or nearby
          cities.
        </div>
      ) : (
        <div className="space-y-4">
          {todaysMatches.map((item) => (
            <MatchCard
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
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Previous Active Matches
          </h3>
          {earlierMatches.map((item) => (
            <MatchCard
              key={item.matchId}
              item={item}
              unblur={unblurByMatch[item.matchId]}
              onOpenChat={() => onOpenChat(item)}
            />
          ))}
        </div>
      )}

      {/* 4th Match Teaser (wired to Mock Paywall in Phase 5) */}
      {!profile.is_plus_mock && hasMore && (
        <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/60 p-4 text-center">
          <p className="text-xs text-slate-300">
            Daily limit reached (3/3 free matches). A 4th compatible match is
            available.
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Mock paywall modal (&quot;Unlock 4th daily match&quot;) will be
            connected in Phase 5.
          </p>
        </div>
      )}
    </div>
  );
}

function MatchCard({
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
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
          <img
            src={partner.avatar_url || "/avatars/avatar-1.svg"}
            alt="Match placeholder avatar"
            className={`h-full w-full object-cover transition-all ${blurClass}`}
          />
          {level < 3 && (
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white/90">
              Lvl {level}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-white">
              {partner.full_name}, {partner.age}
            </h3>
            <span className="rounded-full border border-emerald-800/60 bg-emerald-950 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
              {compatibilityScore}% Match
            </span>
          </div>

          <p className="mt-0.5 text-xs text-slate-300">
            {partner.role_title || "Early-career grad"} • {partner.city} • Batch{" "}
            {partner.batch}
          </p>

          <p className="mt-1 inline-block rounded border border-amber-800/40 bg-amber-950/50 px-2 py-0.5 text-[11px] text-amber-300">
            Simulated eLitmus verification (prototype)
          </p>

          {partner.bio_prompt && (
            <p className="mt-3 text-xs leading-relaxed text-slate-300">
              &ldquo;{partner.bio_prompt}&rdquo;
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
        <span>{unblur?.label ?? "Level 1 (Blurred)"}</span>
        <button
          type="button"
          onClick={onOpenChat}
          className="rounded bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
        >
          Open Chat
        </button>
      </div>
    </div>
  );
}
