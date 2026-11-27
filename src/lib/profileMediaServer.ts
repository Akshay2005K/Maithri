import type { SupabaseClient } from "@supabase/supabase-js";

export const PROFILE_MEDIA_BUCKET = "profile-media";

export function isOwnedMediaPath(path: unknown, ownerId: string): path is string {
  if (typeof path !== "string") return false;
  const [folder, filename, ...nested] = path.split("/");
  return folder === ownerId && nested.length === 0 &&
    /^(photo-[\da-f-]+-(full|blur1|blur2)\.webp|voice-[\da-f-]+\.webm)$/.test(filename ?? "");
}

export async function flushProfileMediaCleanup(admin: SupabaseClient, ownerId: string) {
  const { data, error } = await admin
    .from("profile_media_cleanup")
    .select("object_path")
    .eq("owner_id", ownerId)
    .limit(100);
  if (error) throw error;
  if (!data.length) return;

  const paths = data.map((row) => row.object_path);
  const ownedPaths = paths.filter((path) => isOwnedMediaPath(path, ownerId));
  if (ownedPaths.length) {
    const { error: removalError } = await admin.storage.from(PROFILE_MEDIA_BUCKET).remove(ownedPaths);
    if (removalError) throw removalError;
  }
  const { error: queueError } = await admin
    .from("profile_media_cleanup")
    .delete()
    .eq("owner_id", ownerId)
    .in("object_path", paths);
  if (queueError) throw queueError;
}

export async function removeAllProfileMedia(admin: SupabaseClient, ownerId: string) {
  const bucket = admin.storage.from(PROFILE_MEDIA_BUCKET);
  while (true) {
    const { data, error } = await bucket.list(ownerId, { limit: 100 });
    if (error) throw error;
    if (!data.length) break;

    const paths = data.map((object) => `${ownerId}/${object.name}`);
    if (paths.some((path) => !isOwnedMediaPath(path, ownerId))) {
      throw new Error("Unexpected object in profile media storage.");
    }
    const { error: removalError } = await bucket.remove(paths);
    if (removalError) throw removalError;
  }

  const { error } = await admin.from("profile_media_cleanup").delete().eq("owner_id", ownerId);
  if (error) throw error;
}
