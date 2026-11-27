import type { SupabaseClient } from "@supabase/supabase-js";

export async function getModerationStatus(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin.from("account_moderation")
    .select("suspended, notice").eq("user_id", userId).maybeSingle();
  if (error) throw new Error("Account status could not be checked.");
  return data;
}

export async function eitherAccountSuspended(admin: SupabaseClient, ids: string[]) {
  const { data, error } = await admin.from("account_moderation")
    .select("user_id").in("user_id", ids).eq("suspended", true).limit(1);
  if (error) throw new Error("Account status could not be checked.");
  return data.length > 0;
}
