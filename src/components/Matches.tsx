"use client";

import { useEffect, useState } from "react";
import {
  supabase,
  getRelationshipGoalLabel,
  type Profile,
} from "@/lib/supabase";
import {
  getDisplayedAge,
  getProfileDetailChips,
} from "@/lib/profileOptions";
import type { MatchWithProfile } from "@/lib/matching";
import { getUnblurStatus, type UnblurStatus } from "@/lib/unblur";
import PaywallModal from "@/components/PaywallModal";
import WavePair from "@/components/WavePair";

interface MatchesProps {
  profile: Profile;
  onEditProfile: () => void;
  onOpenChat: (match: MatchWithProfile) => void;
  onProfileUpdated: (updated: Profile) => void;
}

interface LastMessagePreview {
  content: string;
  isMine: boolean;
}

export default function Matches({
  profile,
  onEditProfile,
  onOpenChat,
  onProfileUpdated,
}: MatchesProps) {
  const [todaysMatches, setTodaysMatches] = useState<MatchWithProfile[]>([]);
  const [earlierMatches, setEarlierMatches] = useState<MatchWithProfile[]>([]);
  const [unblurByMatch, setUnblurByMatch] = useState<Record<string, UnblurStatus>>(
    {}
  );
  const [lastMessageByMatch, setLastMessageByMatch] = useState<
    Record<string, LastMessagePreview>
  >({});
  const [filterMode, setFilterMode] = useState<"all" | "like" | "save">("all");
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
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("No active session found. Sign in again.");
        }

        const res = await fetch("/api/matches", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || "Failed to load matches.");
        }
        if (!active) return;

        const todays = result.todaysMatches as MatchWithProfile[];
        const earlier = result.earlierMatches as MatchWithProfile[];
        const allMatchIds = [
          ...todays.map((m) => m.matchId),
          ...earlier.map((m) => m.matchId),
        ];

        const statusMap: Record<string, UnblurStatus> = {};
        const lastMsgMap: Record<string, LastMessagePreview> = {};
        if (allMatchIds.length > 0) {
          const { data: msgRows } = await supabase
            .from("messages")
            .select("match_id, sender_id, content, created_at")
            .in("match_id", allMatchIds)
            .order("created_at", { ascending: true });

          for (const id of allMatchIds) {
            const matchMsgs = (msgRows ?? []).filter((m) => m.match_id === id);
            statusMap[id] = getUnblurStatus(matchMsgs);
            const latest = matchMsgs[matchMsgs.length - 1];
            if (latest) {
              lastMsgMap[id] = {
                content: latest.content,
                isMine: latest.sender_id === profile.id,
              };
            }
          }
        }

        if (!active) return;
        setTodaysMatches(todays);
        setEarlierMatches(earlier);
        setUnblurByMatch(statusMap);
        setLastMessageByMatch(lastMsgMap);
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

  async function handleMatchAction(
    matchId: string,
    action: "like" | "pass" | "save" | "clear"
  ) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    const res = await fetch("/api/match-action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ matchId, action }),
    });
    if (!res.ok) return;

    const updateList = (list: MatchWithProfile[]) =>
      action === "pass"
        ? list.filter((m) => m.matchId !== matchId)
        : list.map((m) =>
            m.matchId === matchId
              ? { ...m, myAction: action === "clear" ? null : action }
              : m
          );

    setTodaysMatches((prev) => updateList(prev));
    setEarlierMatches((prev) => updateList(prev));
  }

  if (loading) {
    return (
      <div className="border-t border-dusk/15 py-8 text-left text-sm text-ink/80">
        Computing today&apos;s compatibility matches...
      </div>
    );
  }

  const allMatchesCombined = [...todaysMatches, ...earlierMatches];
  const likedCount = allMatchesCombined.filter((m) => m.myAction === "like").length;
  const savedCount = allMatchesCombined.filter((m) => m.myAction === "save").length;

  const applyFilter = (list: MatchWithProfile[]) =>
    filterMode === "all"
      ? list
      : list.filter((m) => m.myAction === filterMode);

  const visibleTodays = applyFilter(todaysMatches);
  const visibleEarlier = applyFilter(earlierMatches);

  return (
    <section className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-dusk/15 pb-5">
        <h1 className="text-2xl font-bold text-dusk">
          Today&apos;s curated matches ({todaysMatches.length}/
          {profile.is_plus_mock ? 4 : 3})
        </h1>
        <p className="mt-1 text-sm text-ink/80">
          Generated on open from your compatibility quiz and city (
          {profile.city}).
        </p>
      </div>

      {/* Privacy Shield Status */}
      <div className="rounded-lg border border-teal/40 bg-teal/10 px-4 py-3 text-sm text-ink">
        <p>
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
        </p>
        <p className="mt-1 text-xs text-ink/75">
          Company and college affiliations are self-declared and cannot be
          independently verified.
        </p>
      </div>

      {profile.is_plus_mock && (
        <div className="rounded-lg border border-marigold bg-marigold/20 px-4 py-2.5 text-sm text-ink">
          <strong>Mock Plus active:</strong> fourth daily match slot unlocked
          (no payment).
        </div>
      )}

      {/* Filter pills: All / Liked / Saved */}
      {allMatchesCombined.length > 0 && (
        <div
          role="group"
          aria-label="Filter matches"
          className="flex flex-wrap gap-2"
        >
          {(
            [
              { key: "all", label: `All (${allMatchesCombined.length})` },
              { key: "like", label: `Liked (${likedCount})` },
              { key: "save", label: `Saved (${savedCount})` },
            ] as const
          ).map((tab) => {
            const active = filterMode === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilterMode(tab.key)}
                className={`inline-flex min-h-[40px] items-center rounded-full border px-4 text-xs font-medium transition-colors ${
                  active
                    ? "border-teal bg-dusk text-fog"
                    : "border-dusk/25 bg-fog text-ink hover:bg-dusk/5"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
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
      {visibleTodays.length === 0 ? (
        <div className="rounded-lg border border-dusk/20 bg-dusk/5 p-6 text-left">
          <p className="text-sm text-ink">
            {filterMode !== "all"
              ? `No ${filterMode === "like" ? "liked" : "saved"} matches in today's list.`
              : `No eligible matches found right now in ${profile.city} or nearby cities.`}
          </p>
          {filterMode === "all" && (
            <>
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
            </>
          )}
        </div>
      ) : (
        <div className="divide-y divide-dusk/15 border-y border-dusk/15">
          {visibleTodays.map((item) => (
            <MatchRow
              key={item.matchId}
              item={item}
              unblur={unblurByMatch[item.matchId]}
              lastMessage={lastMessageByMatch[item.matchId]}
              onOpenChat={() => onOpenChat(item)}
              onAction={(action) => handleMatchAction(item.matchId, action)}
            />
          ))}
        </div>
      )}

      {/* Earlier Active Matches */}
      {visibleEarlier.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-lg font-semibold text-dusk">
            Previous active matches
          </h2>
          <div className="divide-y divide-dusk/15 border-y border-dusk/15">
            {visibleEarlier.map((item) => (
              <MatchRow
                key={item.matchId}
                item={item}
                unblur={unblurByMatch[item.matchId]}
                lastMessage={lastMessageByMatch[item.matchId]}
                onOpenChat={() => onOpenChat(item)}
                onAction={(action) => handleMatchAction(item.matchId, action)}
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
  lastMessage,
  onOpenChat,
  onAction,
}: {
  item: MatchWithProfile;
  unblur?: UnblurStatus;
  lastMessage?: LastMessagePreview;
  onOpenChat: () => void;
  onAction: (action: "like" | "pass" | "save" | "clear") => void;
}) {
  const { partner, compatibilityScore, breakdown } = item;
  const blurClass = unblur?.blurClass ?? "blur-xl";
  const level = unblur?.level ?? 1;
  const detailChips = getProfileDetailChips(partner.details);
  const [showPrompts, setShowPrompts] = useState(false);
  const [showAllChips, setShowAllChips] = useState(false);
  const visibleChips = showAllChips ? detailChips : detailChips.slice(0, 5);
  const hasMoreChips = detailChips.length > 5;

  return (
    <article className="flex flex-col gap-6 py-6 md:flex-row md:items-start md:justify-between">
      {/* Left: Avatar + Identity + Bio */}
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-dusk/25 bg-dusk/10">
          <img
            src={partner.avatar_url || "/avatars/avatar-1.svg"}
            alt={`${partner.full_name} placeholder avatar`}
            className={`h-full w-full object-cover ${blurClass}`}
          />
          {level < 3 && (
            <span className="absolute inset-0 flex items-center justify-center bg-[#12122B]/65 text-xs font-semibold text-[#EEF0F6]">
              Level {level}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-lg font-semibold text-dusk">
              {partner.full_name}, {getDisplayedAge(partner)}
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

          {partner.voice_intro_url && (
            <div className="pt-1">
              <p className="mb-1 text-[11px] font-medium text-ink/75">
                Voice introduction
              </p>
              <audio
                controls
                preload="none"
                src={partner.voice_intro_url}
                className="h-9 w-full max-w-xs"
              />
            </div>
          )}

          {detailChips.length > 0 && (
            <div
              aria-label="Profile details and interests"
              className="flex flex-wrap items-center gap-1.5 pt-1"
            >
              {visibleChips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-block rounded-full border border-dusk/25 bg-dusk/5 px-2.5 py-0.5 text-xs font-medium text-ink"
                >
                  {chip.label}
                </span>
              ))}
              {hasMoreChips && (
                <button
                  type="button"
                  onClick={() => setShowAllChips((prev) => !prev)}
                  className="inline-flex min-h-[32px] items-center rounded-full px-2 text-xs font-medium text-dusk underline decoration-teal underline-offset-4 hover:bg-dusk/5"
                >
                  {showAllChips
                    ? "Show fewer"
                    : `+${detailChips.length - 5} more`}
                </button>
              )}
            </div>
          )}

          {Array.isArray(partner.prompts) && partner.prompts.length > 0 && (
            <div className="pt-1.5">
              <button
                type="button"
                aria-expanded={showPrompts}
                onClick={() => setShowPrompts((prev) => !prev)}
                className="inline-flex min-h-[44px] items-center rounded border border-dusk/25 bg-fog px-3 text-xs font-medium text-dusk hover:bg-dusk/5"
              >
                {showPrompts
                  ? "Hide prompts"
                  : `Read ${partner.prompts.length} prompts`}
              </button>

              {showPrompts && (
                <div className="mt-2 space-y-2">
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
            </div>
          )}

          {lastMessage && (
            <div className="flex flex-wrap items-center gap-2 rounded border border-dusk/15 bg-dusk/5 px-3 py-1.5 text-xs">
              {!lastMessage.isMine && (
                <span className="shrink-0 rounded bg-teal/20 px-1.5 py-0.5 font-semibold text-dusk">
                  Your turn to reply
                </span>
              )}
              <p className="min-w-0 flex-1 truncate text-ink/85">
                <strong className="font-medium text-dusk">
                  {lastMessage.isMine ? "You" : partner.full_name.split(/\s+/)[0]}:
                </strong>{" "}
                {lastMessage.content}
              </p>
            </div>
          )}

          <p className="text-xs text-ink/70">
            {unblur?.label ?? "Level 1 (Blurred)"}
          </p>
        </div>
      </div>

      {/* Right: WavePair + breakdown + Open chat action */}
      <div className="flex w-full flex-col gap-3 md:w-72 md:shrink-0 md:items-stretch">
        <WavePair
          score={compatibilityScore}
          breakdown={breakdown}
          showDisclaimer
        />
        <div className="flex gap-2">
          <button
            type="button"
            aria-pressed={item.myAction === "like"}
            onClick={() =>
              onAction(item.myAction === "like" ? "clear" : "like")
            }
            className={`inline-flex min-h-[44px] flex-1 items-center justify-center rounded border px-3 text-xs font-medium ${
              item.myAction === "like"
                ? "border-teal bg-teal/20 text-dusk"
                : "border-dusk/25 bg-fog text-ink hover:bg-dusk/5"
            }`}
          >
            {item.myAction === "like" ? "Liked" : "Like"}
          </button>
          <button
            type="button"
            aria-pressed={item.myAction === "save"}
            onClick={() =>
              onAction(item.myAction === "save" ? "clear" : "save")
            }
            className={`inline-flex min-h-[44px] flex-1 items-center justify-center rounded border px-3 text-xs font-medium ${
              item.myAction === "save"
                ? "border-marigold bg-marigold/25 text-ink"
                : "border-dusk/25 bg-fog text-ink hover:bg-dusk/5"
            }`}
          >
            {item.myAction === "save" ? "Saved" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => onAction("pass")}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded border border-dusk/25 bg-fog px-3 text-xs font-medium text-ink/80 hover:bg-marigold/15"
          >
            Pass
          </button>
        </div>
        <button
          type="button"
          onClick={onOpenChat}
          className="inline-flex min-h-[44px] items-center justify-center rounded bg-dusk px-4 py-2 text-sm font-medium text-fog hover:bg-dusk/90"
        >
          Open chat
        </button>
      </div>
    </article>
  );
}
