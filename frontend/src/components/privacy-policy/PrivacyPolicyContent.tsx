"use client";

import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/layout";
import { Section } from "@/components/ui/Section";

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
          <Section key={section.title} title={section.title}>
            <p className="leading-relaxed opacity-70">{section.body}</p>
          </Section>
        ))}
      </div>
    </PageLayout>
  );
};
