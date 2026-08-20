import { getTranslations } from "next-intl/server";
import { APP_NAME, LOCALES, type Locale } from "@/constants";
import { experienceDurationParts, experiencePeriodYears } from "@/lib/date";

export interface ResumeLabels {
  profile: string;
  experience: string;
  education: string;
  skills: string;
  contact: string;
  social: string;
  network: string;
  findProfile: string;
  findProfileShort: string;
  formatDuration: (startDate: number, endDate?: number) => string;
  formatPeriod: (startDate: number, endDate?: number) => string;
}

export function resolveResumeLanguage(value: unknown): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : "en";
}

export async function getResumeLabels(
  language: Locale,
): Promise<ResumeLabels> {
  const [t, tCommon] = await Promise.all([
    getTranslations({ locale: language, namespace: "resume" }),
    getTranslations({ locale: language, namespace: "common" }),
  ]);

  return {
    profile: t("profile"),
    experience: t("experience"),
    education: t("education"),
    skills: t("skills"),
    contact: t("contact"),
    social: t("social"),
    network: APP_NAME,
    findProfile: t("findProfile", { app: APP_NAME }),
    findProfileShort: t("findProfileShort", { app: APP_NAME }),
    formatDuration: (startDate, endDate) => {
      const { years, months } = experienceDurationParts(startDate, endDate);
      return years > 0
        ? tCommon("yearsCount", { count: years })
        : tCommon("monthsCount", { count: months });
    },
    formatPeriod: (startDate, endDate) => {
      const { startYear, endYear } = experiencePeriodYears(startDate, endDate);
      if (endYear === undefined) return `${tCommon("sinceLabel")} ${startYear}`;
      if (startYear === endYear) return `${startYear}`;
      return `${startYear}/${endYear}`;
    },
  };
}
