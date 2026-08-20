import { describe, it, expect } from "vitest";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import { LOCALES } from "@/constants";

const RESUME_KEYS = [
  "profile",
  "experience",
  "education",
  "skills",
  "contact",
  "social",
  "findProfile",
  "findProfileShort",
] as const;

const COMMON_KEYS = ["sinceLabel", "yearsCount", "monthsCount"] as const;

const MESSAGES = { en, fr } as const;

describe("resume PDF labels", () => {
  it.each(LOCALES)("has every resume label in %s", (locale) => {
    const resume = MESSAGES[locale].resume as Record<string, string>;
    for (const key of RESUME_KEYS) {
      expect(resume[key]?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it.each(LOCALES)("has every period label in %s", (locale) => {
    const common = MESSAGES[locale].common as Record<string, string>;
    for (const key of COMMON_KEYS) {
      expect(common[key]?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it.each(LOCALES)("names every selectable resume language in %s", (locale) => {
    const languages = MESSAGES[locale].languages as Record<string, string>;
    for (const value of LOCALES) {
      expect(languages[value]?.length ?? 0).toBeGreaterThan(0);
    }
  });
});
