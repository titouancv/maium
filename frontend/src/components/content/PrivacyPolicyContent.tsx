"use client";

import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/layout";

export const PrivacyPolicyContent = () => {
  const t = useTranslations("privacyPolicy");

  const sections = [
    { title: t("section1Title"), body: t("section1Body") },
    { title: t("section2Title"), body: t("section2Body") },
    { title: t("section3Title"), body: t("section3Body") },
    { title: t("section4Title"), body: t("section4Body") },
    { title: t("section5Title"), body: t("section5Body") },
    { title: t("section6Title"), body: t("section6Body") },
    { title: t("section7Title"), body: t("section7Body") },
  ];

  return (
    <PageLayout title={t("title")} backLabel={t("backButton")}>
      <div className="flex w-full max-w-2xl flex-col gap-6 pb-8">
        <p className="text-sm opacity-50">{t("lastUpdated")}</p>
        <p className="leading-relaxed">{t("intro")}</p>
        {sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-2">
            <h2 className="text-lg">{section.title}</h2>
            <p className="leading-relaxed opacity-70">{section.body}</p>
          </div>
        ))}
      </div>
    </PageLayout>
  );
};
