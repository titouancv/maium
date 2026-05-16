"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { SlideToEnter, Title } from "@/components/ui";
import { ROUTES } from "@/constants";

interface WelcomeContentProps {
  firstName: string;
  lastName: string;
  pseudo: string;
  dob: string;
  email: string;
  professionalExperiences: unknown[];
  educationalExperiences: unknown[];
}

export const WelcomeContent = ({ firstName }: WelcomeContentProps) => {
  const t = useTranslations("welcome");
  const router = useRouter();

  const handleEnterApp = () => {
    fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingCompleted: true }),
    });
    router.push(`${ROUTES.HOME}?confetti=1`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-12">
      <div className="flex max-w-md flex-col items-start justify-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <Title label={t("greeting", { name: firstName })} size="h1" />
        </div>

        <div className="flex w-full flex-col gap-4 md:max-w-lg">
          <p>{t("founderMessage")}</p>
          <p className="text-sm">{t("founderSignature")}</p>
        </div>
      </div>

      <Button className="hidden md:inline-flex" onClick={handleEnterApp}>
        {t("enterApp")}
      </Button>
      <SlideToEnter
        className="md:hidden"
        label={t("slideToEnter")}
        onConfirm={handleEnterApp}
      />
    </div>
  );
};
