"use client";

import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/layout";
import { Section } from "@/components/ui/Section";

const SECTION_KEYS = [
  "controller",
  "dataCollected",
  "purposes",
  "automatedProcessing",
  "recipients",
  "transfers",
  "retention",
  "security",
  "rights",
  "cookies",
  "minors",
  "changes",
  "contact",
] as const;

const SECTIONS_WITH_LIST = new Set<string>([
  "dataCollected",
  "purposes",
  "recipients",
  "rights",
]);

export const PrivacyPolicyContent = () => {
  const t = useTranslations("privacyPolicy");

  return (
    <PageLayout title={t("title")} backLabel={t("backButton")}>
      <div className="flex w-full max-w-2xl flex-col gap-6 pb-8">
        <p className="text-sm opacity-50">{t("lastUpdated")}</p>
        <p className="leading-relaxed">{t("intro")}</p>
        {SECTION_KEYS.map((key) => {
          const paragraphs = t(`${key}Body`).split("\n\n");
          const items = SECTIONS_WITH_LIST.has(key)
            ? (t.raw(`${key}Items`) as string[])
            : null;
          return (
            <Section key={key} title={t(`${key}Title`)}>
              <div className="flex flex-col gap-3">
                {paragraphs.map((paragraph, index) => (
                  <p key={`${key}-p${index}`} className="leading-relaxed opacity-70">
                    {paragraph}
                  </p>
                ))}
                {items && (
                  <ul className="ml-5 flex list-disc flex-col gap-2 opacity-70">
                    {items.map((item) => (
                      <li key={item} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Section>
          );
        })}
      </div>
    </PageLayout>
  );
};
