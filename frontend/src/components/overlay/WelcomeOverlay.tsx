"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { SlideToEnter, Title } from "@/components/ui";

interface WelcomeContentProps {
  firstName: string;
  onEnter: () => void;
}

export const WelcomeOverlay = ({ firstName, onEnter }: WelcomeContentProps) => {
  const t = useTranslations("welcome");

  const handleEnterApp = () => {
    onEnter();
    return;
  };

  return (
    <div className="bg-surface-50 flex min-h-screen flex-col items-center justify-center gap-12">
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
