import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  mapUserFromDb,
  USER_PROFILE_SELECT,
  type DbUserRaw,
} from "@/lib/mappers/user";
import type { UserData } from "@/types";

// Cached per server request — multiple callers within the same render share
// a single supabase.auth.getUser() round-trip.
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

// Cached per server request — multiple callers (layout, page, helpers) share
// a single profile fetch instead of repeating it.
export const getCurrentUserProfile = cache(
  async (): Promise<UserData | null> => {
    const authUser = await getAuthUser();
    if (!authUser) return null;

    const supabase = await createClient();
    const { data } = await supabase
      .from("users")
      .select(
        `email, first_name, last_name, pseudo, dob, onboarding_completed, phone, nationality, location, bio, ${USER_PROFILE_SELECT}`,
      )
      .eq("id", authUser.id)
      .single();

    if (!data) return null;
    return mapUserFromDb(data as unknown as DbUserRaw);
  },
);
