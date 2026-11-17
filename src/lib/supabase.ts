import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client using the public anon key.
// Supabase Auth stores the user's JWT session in browser localStorage automatically.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
