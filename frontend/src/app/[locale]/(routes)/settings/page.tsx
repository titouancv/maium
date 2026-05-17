import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { SettingsContent } from "@/components/content/SettingsContent";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let userData = null;
  if (authUser) {
    const { data } = await supabase
      .from("users")
      .select("email, first_name, last_name, pseudo, dob")
      .eq("id", authUser.id)
      .single();

    userData = data;
  }

  return (
    <Suspense>
      <SettingsContent user={userData} />
    </Suspense>
  );
}
