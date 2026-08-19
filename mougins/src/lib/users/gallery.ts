import type { SupabaseClient } from "@supabase/supabase-js";
import { PROFILE_GALLERY_MAX_PHOTOS, PROFILE_GALLERY_PHOTOS_BUCKET } from "@/constants";

export const GALLERY_FULL = "GALLERY_FULL";
export const GALLERY_INVALID_ORDER = "GALLERY_INVALID_ORDER";

export async function addPhoto(
  supabase: SupabaseClient,
  userId: string,
  photo: { url: string; path: string },
): Promise<{ id: string }> {
  const { count, error: countError } = await supabase
    .from("user_photos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (countError) throw countError;
  if ((count ?? 0) >= PROFILE_GALLERY_MAX_PHOTOS) {
    throw new Error(GALLERY_FULL);
  }

  const { data, error } = await supabase
    .from("user_photos")
    .insert({
      user_id: userId,
      url: photo.url,
      path: photo.path,
      position: count ?? 0,
    })
    .select("id")
    .single();
  if (error) throw error;

  return { id: data.id };
}

export async function deletePhoto(
  supabase: SupabaseClient,
  userId: string,
  photoId: string,
): Promise<void> {
  const { data, error: fetchError } = await supabase
    .from("user_photos")
    .select("path")
    .eq("id", photoId)
    .eq("user_id", userId)
    .single();
  if (fetchError) throw fetchError;

  const { error: deleteError } = await supabase
    .from("user_photos")
    .delete()
    .eq("id", photoId)
    .eq("user_id", userId);
  if (deleteError) throw deleteError;

  const { error: storageError } = await supabase.storage
    .from(PROFILE_GALLERY_PHOTOS_BUCKET)
    .remove([data.path]);
  if (storageError) throw storageError;
}

export async function reorderPhotos(
  supabase: SupabaseClient,
  userId: string,
  order: string[],
): Promise<void> {
  const { data: owned, error: fetchError } = await supabase
    .from("user_photos")
    .select("id")
    .eq("user_id", userId);
  if (fetchError) throw fetchError;

  const ownedIds = new Set((owned ?? []).map((row) => row.id as string));
  if (order.length !== ownedIds.size || !order.every((id) => ownedIds.has(id))) {
    throw new Error(GALLERY_INVALID_ORDER);
  }

  for (const [position, id] of order.entries()) {
    const { error } = await supabase
      .from("user_photos")
      .update({ position })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
  }
}
