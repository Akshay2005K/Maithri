import type { SupabaseClient } from "@supabase/supabase-js";
import {
  RELATIONSHIP_GOALS,
  type Profile,
  type RelationshipGoal,
  type SafePartnerProfile,
} from "./supabase";
import { getDisplayedAge } from "./profileOptions";

export interface MatchWithProfile {
  matchId: string;
  compatibilityScore: number;
  matchDate: string;
  partner: SafePartnerProfile;
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
  const today = new Date().toISOString().slice(0, 10);

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

  // Enforce the daily cap (3/day, or 4/day with Plus) by counting today's rows
  const activeExisting = (existingMatches ?? []).filter(
    (m) => !blockedIds.has(m.user_a === me.id ? m.user_b : m.user_a)
  );
  const todaysRows = activeExisting.filter((m) => m.match_date === today);
  const earlierRows = activeExisting.filter((m) => m.match_date !== today);

  const dailyCap = me.is_plus_mock ? 4 : 3;
  const slotsNeeded = Math.max(0, dailyCap - todaysRows.length);

  // Filter eligible candidates & count Privacy Shield removals
  let hiddenByShieldCount = 0;
  const eligible: { candidate: Profile; score: number }[] = [];
  const allowedCities = NEARBY_CITIES[me.city] ?? [me.city];

  for (const candidate of (allProfiles ?? []) as Profile[]) {
    if (candidate.id === me.id) continue;
    if (blockedIds.has(candidate.id)) continue;

    // Mutual gender / interested-in check + same/nearby city check
    if (
      !doesInterestedInIncludeGender(me.looking_for, candidate.gender) ||
      !doesInterestedInIncludeGender(candidate.looking_for, me.gender)
    ) {
      continue;
    }
    if (!allowedCities.includes(candidate.city)) continue;

    // Privacy Shield: hide same company domain or same college
    const sameCompany =
      Boolean(me.company_domain && candidate.company_domain) &&
      me.company_domain!.toLowerCase() === candidate.company_domain!.toLowerCase();
    const sameCollege =
      Boolean(me.college_name && candidate.college_name) &&
      me.college_name!.toLowerCase() === candidate.college_name!.toLowerCase();

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

  const toMatchWithProfile = (rows: typeof todaysRows): MatchWithProfile[] =>
    rows
      .map((m) => {
        const partnerId = m.user_a === me.id ? m.user_b : m.user_a;
        const partner = profileMap.get(partnerId);
        if (!partner) return null;
        return {
          matchId: m.id,
          compatibilityScore: m.compatibility_score,
          matchDate: m.match_date,
          partner: toSafePartnerProfile(partner),
        };
      })
      .filter((item): item is MatchWithProfile => item !== null)
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  return {
    todaysMatches: toMatchWithProfile(todaysRows),
    earlierMatches: toMatchWithProfile(earlierRows),
    hiddenByShieldCount,
    hasMoreCandidates: eligible.length > slotsNeeded,
  };
}
