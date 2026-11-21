import { createClient } from "@supabase/supabase-js";
import type { ProfileDetails } from "./profileOptions";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client using the public anon key.
// Supabase Auth stores the user's JWT session in browser localStorage automatically.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type RelationshipGoal =
  | "friendship"
  | "casual"
  | "open"
  | "long_term"
  | "marriage";

export const RELATIONSHIP_GOALS: {
  key: RelationshipGoal;
  label: string;
  order: number;
}[] = [
  { key: "friendship", label: "Friendship-first", order: 0 },
  { key: "casual", label: "Something casual", order: 1 },
  { key: "open", label: "Open to see where it goes", order: 2 },
  { key: "long_term", label: "A long-term relationship", order: 3 },
  { key: "marriage", label: "Marriage", order: 4 },
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

export interface PhotoPaths {
  blur1: string;
  blur2: string;
  full: string;
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
  has_uploaded_photo?: boolean;
  voice_intro_url?: string | null;
  relationship_goal: RelationshipGoal | null;
  prompts: ProfilePrompt[] | null;
  details?: ProfileDetails | null;
}

export interface DealBreakers {
  non_smoker_only?: boolean;
  min_age?: number | null;
  max_age?: number | null;
}

export interface Profile extends SafePartnerProfile {
  looking_for: string;
  company_domain: string | null;
  college_name: string | null;
  hide_same_company: boolean;
  hide_same_college: boolean;
  is_incognito?: boolean;
  deal_breakers?: DealBreakers | null;
  photo_paths?: PhotoPaths | null;
  voice_intro_path?: string | null;
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
