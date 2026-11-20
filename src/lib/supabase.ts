import { createClient } from "@supabase/supabase-js";
import type { ProfileDetails } from "./profileOptions";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client using the public anon key.
// Supabase Auth stores the user's JWT session in browser localStorage automatically.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type RelationshipGoal = "casual" | "open" | "long_term" | "marriage";

export const RELATIONSHIP_GOALS: {
  key: RelationshipGoal;
  label: string;
  order: number;
}[] = [
  { key: "casual", label: "Something casual", order: 0 },
  { key: "open", label: "Open to see where it goes", order: 1 },
  { key: "long_term", label: "A long-term relationship", order: 2 },
  { key: "marriage", label: "Marriage", order: 3 },
];

export const PROMPT_KEYS = [
  "A perfect Sunday",
  "I'm happiest when",
  "Something I'm learning",
  "A small thing I care about",
  "My ideal first date",
  "A city habit I love",
] as const;

export interface ProfilePrompt {
  key: string;
  answer: string;
}

export function getRelationshipGoalLabel(
  goal: RelationshipGoal | null | undefined
): string | null {
  if (!goal) return null;
  return RELATIONSHIP_GOALS.find((g) => g.key === goal)?.label ?? null;
}

export interface SafePartnerProfile {
  id: string;
  full_name: string;
  age: number;
  birth_date?: string | null;
  gender: string;
  city: string;
  role_title: string | null;
  batch: number | null;
  bio_prompt: string | null;
  avatar_url: string | null;
  relationship_goal: RelationshipGoal | null;
  prompts: ProfilePrompt[] | null;
  details?: ProfileDetails | null;
}

export interface Profile extends SafePartnerProfile {
  looking_for: string;
  company_domain: string | null;
  college_name: string | null;
  hide_same_company: boolean;
  hide_same_college: boolean;
  q1: number | null;
  q2: number | null;
  q3: number | null;
  q4: number | null;
  q5: number | null;
  dpdp_consent_at: string;
  house_rules_accepted_at?: string | null;
  is_plus_mock: boolean;
  created_at?: string;
}
