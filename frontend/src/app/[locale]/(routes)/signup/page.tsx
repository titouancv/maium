import { Suspense } from "react";
import { SignupWizard } from "@/components/content/SignupContent";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { ROUTES } from "@/constants";
import type { UserState } from "@/stores/useUserStore";
import type { Experience } from "@/types/experience";

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
      .select(
        "pseudo, dob, first_name, last_name, onboarding_completed, professional_experiences, educational_experiences",
      )
      .eq("id", user.id)
      .single();

    if (profile?.onboarding_completed) {
      redirect(ROUTES.HOME);
    }

    initialStep = profile?.dob ? 4 : profile?.pseudo ? 3 : 1;
    initialUser = {
      supabaseId: user.id,
      email: user.email,
      firstName: profile?.first_name ?? user.user_metadata?.given_name ?? "",
      lastName: profile?.last_name ?? user.user_metadata?.family_name ?? "",
      pseudo: profile?.pseudo ?? undefined,
      dob: profile?.dob ?? undefined,
      professionalExperiences:
        (profile?.professional_experiences as unknown as Experience[] | null) ?? [],
      educationalExperiences:
        (profile?.educational_experiences as unknown as Experience[] | null) ?? [],
    };
  }

  return (
    <Suspense>
      <SignupWizard initialStep={initialStep} initialUser={initialUser} />
    </Suspense>
  );
}
