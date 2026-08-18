import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  mapUserFromDb,
  USER_PROFILE_SELECT,
  type DbUserRaw,
} from "@/lib/mappers/user";
import type { UserData } from "@/types";

export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentUserProfile = cache(
  async (): Promise<UserData | null> => {
    const authUser = await getAuthUser();
    if (!authUser) return null;

    const supabase = await createClient();
    const { data } = await supabase
      .from("users")
      .select(
        `id, email, first_name, last_name, pseudo, dob, gender, onboarding_completed, email_notifications, locale, phone, nationality, location, bio, profile_photo, dream_company_types, dream_work_mode, dream_location, dream_salary, dream_industries, dream_company_values, ${USER_PROFILE_SELECT}`,
      )
      .eq("id", authUser.id)
      .single();

    if (!data) return null;
    return mapUserFromDb(data as unknown as DbUserRaw);
  },
);
