import { SignupWizard } from "@/components/auth/SignupWizard";
import { Title } from "@/components/ui";
import { getTranslations } from "next-intl/server";

export default async function SignupPage() {
  const t = await getTranslations("auth.signup");

  return (
    <div className="bg-surface-50 flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Title label={t("title")} className="mb-6 text-center" size="h1" />
        <SignupWizard />
      </div>
    </div>
  );
}
