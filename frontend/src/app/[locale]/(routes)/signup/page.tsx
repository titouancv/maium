import { SignupWizard } from "@/components/auth/SignupWizard";
import { Title } from "@/components/ui";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants";
import type { UserState } from "@/stores/useUserStore";

export default async function SignupPage() {
  const t = await getTranslations("auth.signup");
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

  return (
    <div className="bg-surface-50 flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Title label={t("title")} className="mb-6 text-center" size="h1" />
        <SignupWizard initialStep={initialStep} initialUser={initialUser} />
      </div>
    </div>
  );
}
