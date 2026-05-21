import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { HomeContent } from "@/components/content/HomeContent";
import { redirect } from "@/i18n/navigation";
import { ROUTES } from "@/constants";

export default async function HomePage() {
  const locale = await getLocale();
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

    if (
      data &&
      !data.onboarding_completed &&
      (!data.first_name || !data.last_name || !data.pseudo || !data.dob)
    ) {
      redirect({ href: ROUTES.SIGNUP, locale });
    }
  }

  return (
    <Suspense>
      <HomeContent user={userData} />
    </Suspense>
  );
}
