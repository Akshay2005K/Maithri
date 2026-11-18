import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client using the public anon key.
// Supabase Auth stores the user's JWT session in browser localStorage automatically.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  looking_for: string;
  city: string;
  role_title: string | null;
  company_domain: string | null;
  college_name: string | null;
  batch: number | null;
  hide_same_company: boolean;
  hide_same_college: boolean;
  bio_prompt: string | null;
  avatar_url: string | null;
  q1: number | null;
  q2: number | null;
  q3: number | null;
  q4: number | null;
  q5: number | null;
  dpdp_consent_at: string;
  is_plus_mock: boolean;
  created_at?: string;
}
