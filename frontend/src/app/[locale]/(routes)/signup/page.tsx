import { SignupWizard } from "@/components/auth/SignupWizard";
import { getTranslations } from "next-intl/server";

export default async function SignupPage() {
  const t = await getTranslations("auth.signup");

  return (
    <div className="bg-surface-50 flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-txt mb-8 text-center text-2xl font-bold">
          {t("title")}
        </h1>
        <SignupWizard />
      </div>
    </div>
  );
}
