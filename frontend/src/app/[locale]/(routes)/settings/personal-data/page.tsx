import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { SettingsPersonalDataContent } from "@/components/content/SettingsPersonalDataContent";

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
        "email, first_name, last_name, pseudo, dob, phone, nationality, location, professional_experiences, educational_experiences",
      )
      .eq("id", authUser.id)
      .single();

    userData = data;
  }

  return (
    <Suspense>
      <SettingsPersonalDataContent user={userData} />
    </Suspense>
  );
}
