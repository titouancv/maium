import { SignupWizard } from "@/components/content/SignupContent";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants";
import type { UserState } from "@/stores/useUserStore";

export default async function SignupPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialStep = 0;
  let initialUser: Partial<UserState> = {};

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("pseudo, dob, first_name, last_name, onboarding_completed")
      .eq("id", user.id)
      .single();

    if (profile?.onboarding_completed) {
      redirect(ROUTES.HOME);
    }

    if (profile?.pseudo && profile?.dob) {
      redirect(ROUTES.WELCOME);
    }

    initialStep = profile?.pseudo ? 3 : 1;
    initialUser = {
      supabaseId: user.id,
      email: user.email,
      firstName: profile?.first_name ?? user.user_metadata?.given_name ?? "",
      lastName: profile?.last_name ?? user.user_metadata?.family_name ?? "",
      pseudo: profile?.pseudo ?? undefined,
    };
  }

  return <SignupWizard initialStep={initialStep} initialUser={initialUser} />;
}
