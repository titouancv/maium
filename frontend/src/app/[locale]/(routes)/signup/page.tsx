import { SignupWizard } from "@/components/auth/SignupWizard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants";
import type { UserState } from "@/stores/useUserStore";

export default async function SignupPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialStep = 1;
  let initialUser: Partial<UserState> = {};

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("pseudo")
      .eq("id", user.id)
      .single();

    if (profile?.pseudo) {
      redirect(ROUTES.HOME);
    }

    initialStep = 2;
    initialUser = {
      supabaseId: user.id,
      email: user.email,
      firstName: user.user_metadata?.given_name ?? "",
      lastName: user.user_metadata?.family_name ?? "",
    };
  }

  return <SignupWizard initialStep={initialStep} initialUser={initialUser} />;
}
