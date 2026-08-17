"use client";

import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { Link } from "@/i18n/navigation";
import { PageLayout } from "@/components/layout";
import { Text } from "@/components/ui";

export const UnsubscribedContent = () => {
  const t = useTranslations("emails.unsubscribed");

  return (
    <PageLayout title={t("title")}>
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <Text tone="muted">{t("description")}</Text>
        <Link
          href={ROUTES.SETTINGS_NOTIFICATIONS}
          className="text-primary w-fit font-extrabold"
        >
          {t("manageLink")}
        </Link>
      </div>
    </PageLayout>
  );
};
