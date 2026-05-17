import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { HomeContent } from "@/components/content/HomeContent";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let userData = null;
  if (authUser) {
    const { data } = await supabase
      .from("users")
      .select("email, first_name, last_name, pseudo, dob, onboarding_completed")
      .eq("id", authUser.id)
      .single();

    userData = data;
  }

  return (
    <Suspense>
      <HomeContent user={userData} />
    </Suspense>
  );
}
