import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { SettingsPersonalDataContent } from "@/components/content/SettingsPersonalDataContent";
import { mapUserFromDb, USER_PROFILE_SELECT, type DbUserRaw } from "@/lib/mappers/user";

export default async function SettingsPersonalDataPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let userData = null;
  if (authUser) {
    const { data } = await supabase
      .from("users")
      .select(
        `email, first_name, last_name, pseudo, dob, phone, nationality, location, ${USER_PROFILE_SELECT}`,
      )
      .eq("id", authUser.id)
      .single();

    userData = data ? mapUserFromDb(data as unknown as DbUserRaw) : null;
  }

  return (
    <Suspense>
      <SettingsPersonalDataContent user={userData} />
    </Suspense>
  );
}
