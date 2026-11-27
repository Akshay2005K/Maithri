import type { SupabaseClient } from "@supabase/supabase-js";
import {
  RELATIONSHIP_GOALS,
  type Profile,
  type RelationshipGoal,
  type SafePartnerProfile,
} from "./supabase";
import { getDisplayedAge } from "./profileOptions";
import { getUnblurStatus } from "./unblur";
import { getEntitlements } from "./entitlements";
import { isOwnedMediaPath, PROFILE_MEDIA_BUCKET } from "./profileMediaServer";

const matchDateFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getMatchDate(date = new Date()): string {
  return matchDateFormatter.format(date);
}

export interface CompatibilityFactor {
  key: "q1" | "q2" | "q3" | "q4" | "q5";
  label: string;
  score: number;
}

export interface CompatibilityBreakdown {
  sharedInterests: string[];
  cityLabel: string;
  goalSummary: string;
  factors: CompatibilityFactor[];
}

export type MatchUserAction = "like" | "pass" | "save" | null;

export interface MatchWithProfile {
  matchId: string;
  compatibilityScore: number;
  matchDate: string;
  partner: SafePartnerProfile;
  breakdown?: CompatibilityBreakdown;
  reasons: CompatibilityBreakdown | null;
  reasons_locked: boolean;
  myAction?: MatchUserAction;
  hasMessages: boolean;
  unmatchedByPartner?: boolean;
  closedAt?: string | null;
  closureReason?: string | null;
}

const GOAL_ORDER: Record<RelationshipGoal, number> = Object.fromEntries(
  RELATIONSHIP_GOALS.map((g) => [g.key, g.order])
) as Record<RelationshipGoal, number>;

const NEARBY_CITIES: Record<string, string[]> = {
  Bengaluru: ["Bengaluru", "Hyderabad", "Chennai"],
  Hyderabad: ["Hyderabad", "Bengaluru", "Chennai"],
  Chennai: ["Chennai", "Bengaluru", "Hyderabad"],
  Pune: ["Pune", "Mumbai", "Bengaluru"],
  Mumbai: ["Mumbai", "Pune", "Bengaluru"],
  NCR: ["NCR", "Bengaluru", "Pune"],
};

function toSafePartnerProfile(p: Profile): SafePartnerProfile {
  return {
    id: p.id,
    full_name: p.full_name,
    age: getDisplayedAge(p),
    birth_date: p.birth_date ?? null,
    gender: p.gender,
    city: p.city,
    role_title: p.role_title,
    batch: p.batch,
    bio_prompt: p.bio_prompt,
    avatar_url: p.avatar_url,
    relationship_goal: p.relationship_goal,
    prompts: p.prompts,
    details: p.details ?? null,
  };
}

function parseCommaList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function listsOverlap(a: string[], b: string[]): boolean {
  if (a.length === 0 || b.length === 0) return false;
  const setB = new Set(b);
  return a.some((item) => setB.has(item));
}

// A candidate qualifies only if my interested-in includes their gender
// AND their interested-in includes my gender ("everyone" matches all).
export function doesInterestedInIncludeGender(
  interestedIn: string,
  gender: string
): boolean {
  const normInterest = interestedIn.trim().toLowerCase();
  const normGender = gender.trim().toLowerCase();
  if (normInterest === "everyone" || normInterest === "all") return true;
  if (normInterest === "men" || normInterest === "m") {
    return normGender === "man" || normGender === "m";
  }
  if (normInterest === "women" || normInterest === "f") {
    return normGender === "woman" || normGender === "f";
  }
  if (normInterest === "beyond_binary" || normInterest === "other") {
    return normGender === "beyond_binary" || normGender === "other";
  }
  return false;
}

const QUIZ_FACTOR_LABELS: {
  key: "q1" | "q2" | "q3" | "q4" | "q5";
  label: string;
}[] = [
  { key: "q1", label: "Work-life rhythm" },
  { key: "q2", label: "Weekend battery" },
  { key: "q3", label: "Financial style" },
  { key: "q4", label: "Conflict style" },
  { key: "q5", label: "City flexibility" },
];

export function computeCompatibilityBreakdown(
  a: Profile,
  b: Profile
): CompatibilityBreakdown {
  const myInterests = Array.isArray(a.details?.interests)
    ? a.details.interests
    : [];
  const theirInterests = new Set(
    Array.isArray(b.details?.interests) ? b.details.interests : []
  );
  const sharedInterests = myInterests.filter((item) => theirInterests.has(item));

  const cityLabel =
    a.city === b.city
      ? `Same city (${b.city})`
      : `Nearby city (${b.city})`;

  const goalDiff =
    a.relationship_goal && b.relationship_goal
      ? Math.abs(
          GOAL_ORDER[a.relationship_goal] - GOAL_ORDER[b.relationship_goal]
        )
      : 0;
  const goalSummary =
    goalDiff === 0 ? "Same relationship goal" : "Compatible relationship goals";

  const factors: CompatibilityFactor[] = QUIZ_FACTOR_LABELS.map((item) => {
    const diff = Math.abs((a[item.key] ?? 3) - (b[item.key] ?? 3));
    return {
      key: item.key,
      label: item.label,
      score: Math.round(100 - (diff / 4) * 100),
    };
  });

  return {
    sharedInterests,
    cityLabel,
    goalSummary,
    factors,
  };
}

// 100 minus the average absolute difference across q1..q5, scaled from [0..4] to [0..100].
export function computeCompatibilityScore(a: Profile, b: Profile): number {
  const diffs = [
    Math.abs((a.q1 ?? 3) - (b.q1 ?? 3)),
    Math.abs((a.q2 ?? 3) - (b.q2 ?? 3)),
    Math.abs((a.q3 ?? 3) - (b.q3 ?? 3)),
    Math.abs((a.q4 ?? 3) - (b.q4 ?? 3)),
    Math.abs((a.q5 ?? 3) - (b.q5 ?? 3)),
  ];
  const avgDiff = diffs.reduce((sum, d) => sum + d, 0) / 5;
  return Math.round(100 - (avgDiff / 4) * 100);
}

// Runs server-side via adminClient so clients cannot bypass the 3/day cap,
// Privacy Shield, blocks, or read other users' quiz answers and company domains.
export async function getOrCreateTodaysMatchesForUser(
  me: Profile,
  adminClient: SupabaseClient
): Promise<{
  todaysMatches: MatchWithProfile[];
  earlierMatches: MatchWithProfile[];
  hiddenByShieldCount: number;
  hasMoreCandidates: boolean;
}> {
  const today = getMatchDate();

  const [{ data: existingMatches }, { data: blocks }, { data: allProfiles }] =
    await Promise.all([
      adminClient
        .from("matches")
        .select("*")
        .or(`user_a.eq.${me.id},user_b.eq.${me.id}`),
      adminClient
        .from("reports_blocks")
        .select("reporter_id, reported_id")
        .or(`reporter_id.eq.${me.id},reported_id.eq.${me.id}`),
      adminClient.from("profiles").select("*"),
    ]);

  // Bidirectional block check: anyone I blocked OR who blocked me
  const blockedIds = new Set(
    (blocks ?? []).map((b) =>
      b.reporter_id === me.id ? b.reported_id : b.reporter_id
    )
  );
  const existingPartnerIds = new Set(
    (existingMatches ?? []).map((m) =>
      m.user_a === me.id ? m.user_b : m.user_a
    )
  );
  const profileMap = new Map(
    (allProfiles ?? []).map((p) => [p.id, p as Profile])
  );

  // Enforce the daily cap (3/day, or 4/day with Plus) by counting all rows created today
  // (including passed/unmatched ones so neither can bypass the daily cap).
  const activeExisting = (existingMatches ?? []).filter((m) => {
    const partnerId = m.user_a === me.id ? m.user_b : m.user_a;
    if (blockedIds.has(partnerId)) return false;

    const actionMap =
      m.action_state && typeof m.action_state === "object"
        ? (m.action_state as Record<string, string>)
        : {};
    const myState = actionMap[me.id];
    const partnerState = actionMap[partnerId];

    // Hide if I passed or unmatched/dismissed, or if the partner passed (quiet removal)
    if (myState === "pass" || myState === "unmatched") return false;
    if (partnerState === "pass") return false;

    // If closed/unmatched, hide from the person who closed it, keep visible for the other person
    const closedAt = m.closed_at ?? m.unmatched_at;
    const closedBy = m.closed_by ?? m.unmatched_by;
    if (closedAt && closedBy === me.id) return false;

    return true;
  });
  const todaysCreatedCount = (existingMatches ?? []).filter(
    (m) => m.match_date === today
  ).length;
  const todaysRows = activeExisting.filter((m) => m.match_date === today);
  const earlierRows = activeExisting.filter((m) => m.match_date !== today);

  const dailyCap = getEntitlements(me.plan, me.plan_expires_at).dailyMatches;
  const slotsNeeded = Math.max(0, dailyCap - todaysCreatedCount);

  // Filter eligible candidates & count Privacy Shield removals
  let hiddenByShieldCount = 0;
  const eligible: { candidate: Profile; score: number }[] = [];
  const allowedCities = NEARBY_CITIES[me.city] ?? [me.city];

  for (const candidate of (allProfiles ?? []) as Profile[]) {
    if (candidate.id === me.id) continue;
    if (candidate.is_incognito) continue;
    if (blockedIds.has(candidate.id)) continue;

    // Deal-breakers check (bidirectional)
    const candidateAge = getDisplayedAge(candidate);
    const myAge = getDisplayedAge(me);
    const myBreakers = me.deal_breakers ?? {};
    const theirBreakers = candidate.deal_breakers ?? {};

    if (
      myBreakers.non_smoker_only &&
      candidate.details?.smoking === "smoker"
    ) {
      continue;
    }
    if (
      theirBreakers.non_smoker_only &&
      me.details?.smoking === "smoker"
    ) {
      continue;
    }
    if (typeof myBreakers.min_age === "number" && candidateAge < myBreakers.min_age) {
      continue;
    }
    if (typeof myBreakers.max_age === "number" && candidateAge > myBreakers.max_age) {
      continue;
    }
    if (typeof theirBreakers.min_age === "number" && myAge < theirBreakers.min_age) {
      continue;
    }
    if (typeof theirBreakers.max_age === "number" && myAge > theirBreakers.max_age) {
      continue;
    }

    // Mutual gender / interested-in check + same/nearby city check
    if (
      !doesInterestedInIncludeGender(me.looking_for, candidate.gender) ||
      !doesInterestedInIncludeGender(candidate.looking_for, me.gender)
    ) {
      continue;
    }
    if (!allowedCities.includes(candidate.city)) continue;

    // Privacy Shield: hide same company domain(s) or same college(s) (comma-separated)
    const sameCompany = listsOverlap(
      parseCommaList(me.company_domain),
      parseCommaList(candidate.company_domain)
    );
    const sameCollege = listsOverlap(
      parseCommaList(me.college_name),
      parseCommaList(candidate.college_name)
    );

    const hiddenByMyShield =
      (me.hide_same_company && sameCompany) ||
      (me.hide_same_college && sameCollege);
    const hiddenByTheirShield =
      (candidate.hide_same_company && sameCompany) ||
      (candidate.hide_same_college && sameCollege);

    if (hiddenByMyShield) {
      hiddenByShieldCount++;
      continue;
    }
    if (hiddenByTheirShield) {
      continue;
    }

    if (existingPartnerIds.has(candidate.id)) continue;

    // Relationship goal alignment: exclude diff >= 2, subtract 10 if diff === 1
    if (!me.relationship_goal || !candidate.relationship_goal) continue;
    const goalDiff = Math.abs(
      GOAL_ORDER[me.relationship_goal] - GOAL_ORDER[candidate.relationship_goal]
    );
    if (goalDiff >= 2) continue;

    const baseScore = computeCompatibilityScore(me, candidate);
    const finalScore =
      goalDiff === 1 ? Math.max(0, baseScore - 10) : baseScore;

    eligible.push({ candidate, score: finalScore });
  }

  // Sort highest compatibility first and insert only up to today's remaining cap
  eligible.sort((a, b) => b.score - a.score);
  const toInsert = eligible.slice(0, slotsNeeded);

  if (toInsert.length > 0) {
    const { data: inserted } = await adminClient
      .from("matches")
      .insert(
        toInsert.map((item) => ({
          user_a: me.id,
          user_b: item.candidate.id,
          compatibility_score: item.score,
          match_date: today,
        }))
      )
      .select("*");
    if (inserted) todaysRows.push(...inserted);
  }

  const allDisplayedMatchIds = [...todaysRows, ...earlierRows].map((m) => m.id);
  const messagesByMatch = new Map<
    string,
    { sender_id: string; content: string }[]
  >();
  if (allDisplayedMatchIds.length > 0) {
    const { data: msgRows } = await adminClient
      .from("messages")
      .select("match_id, sender_id, content")
      .in("match_id", allDisplayedMatchIds);

    for (const row of msgRows ?? []) {
      const list = messagesByMatch.get(row.match_id) ?? [];
      list.push({ sender_id: row.sender_id, content: row.content });
      messagesByMatch.set(row.match_id, list);
    }
  }

  const toMatchWithProfile = async (
    rows: typeof todaysRows
  ): Promise<MatchWithProfile[]> => {
    const items = await Promise.all(
      rows.map(async (m): Promise<MatchWithProfile | null> => {
        const partnerId = m.user_a === me.id ? m.user_b : m.user_a;
        const partner = profileMap.get(partnerId);
        if (!partner) return null;
        const actionMap =
          m.action_state && typeof m.action_state === "object"
            ? (m.action_state as Record<string, string>)
            : {};
        const rawAction = actionMap[me.id];
        const myAction: MatchUserAction =
          rawAction === "like" || rawAction === "pass" || rawAction === "save"
            ? rawAction
            : null;

        const safePartner = toSafePartnerProfile(partner);
        const matchMsgs = messagesByMatch.get(m.id) ?? [];
        const hasMessages = matchMsgs.length > 0;
        const closedAt = (m.closed_at ?? m.unmatched_at ?? null) as string | null;
        const closedBy = (m.closed_by ?? m.unmatched_by ?? null) as string | null;
        const unmatchedByPartner = Boolean(closedAt && closedBy !== me.id);

        // If partner uploaded a real photo, serve only the signed URL matching the current unblur level
        if (partner.photo_paths && typeof partner.photo_paths === "object") {
          const unblur = getUnblurStatus(matchMsgs);
          const levelPath =
            unblur.level === 3
              ? partner.photo_paths.full
              : unblur.level === 2
                ? partner.photo_paths.blur2
                : partner.photo_paths.blur1;

          if (isOwnedMediaPath(levelPath, partnerId)) {
            const { data: signed } = await adminClient.storage
              .from(PROFILE_MEDIA_BUCKET)
              .createSignedUrl(levelPath, 3600);
            if (signed?.signedUrl) {
              safePartner.avatar_url = signed.signedUrl;
              safePartner.has_uploaded_photo = true;
            }
          }
        }

        if (isOwnedMediaPath(partner.voice_intro_path, partnerId)) {
          const { data: signedVoice } = await adminClient.storage
            .from(PROFILE_MEDIA_BUCKET)
            .createSignedUrl(partner.voice_intro_path, 3600);
          if (signedVoice?.signedUrl) {
            safePartner.voice_intro_url = signedVoice.signedUrl;
          }
        }

        const canSeeReasons = getEntitlements(
          me.plan,
          me.plan_expires_at
        ).matchReasons;
        const reasons = canSeeReasons
          ? computeCompatibilityBreakdown(me, partner)
          : null;

        return {
          matchId: m.id,
          compatibilityScore: m.compatibility_score,
          matchDate: m.match_date,
          partner: safePartner,
          ...(reasons ? { breakdown: reasons } : {}),
          reasons,
          reasons_locked: !canSeeReasons,
          myAction,
          hasMessages,
          unmatchedByPartner,
          closedAt,
          closureReason: (m.closure_reason as string | null) ?? null,
        };
      })
    );

    return items
      .filter((item): item is MatchWithProfile => item !== null)
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  };

  const [todaysMatches, earlierMatches] = await Promise.all([
    toMatchWithProfile(todaysRows),
    toMatchWithProfile(earlierRows),
  ]);

  return {
    todaysMatches,
    earlierMatches,
    hiddenByShieldCount,
    hasMoreCandidates: eligible.length > slotsNeeded,
  };
}
