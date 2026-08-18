"use client";

import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui";

export const DreamJobBanner = () => {
  const t = useTranslations("home");

  return (
    <div className="bg-inverse-50 text-txt-inverse flex flex-col gap-4 rounded-sm p-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-lg font-extrabold">
        {t("actions.dreamJobDescription")}
      </p>
      <Link
        href={`${ROUTES.SETTINGS_DREAM_JOB}?onboarding=1`}
        className="shrink-0"
      >
        <Button variant="primary">{t("actions.dreamJobTitle")}</Button>
      </Link>
    </div>
  );
};
