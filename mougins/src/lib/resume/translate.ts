import { chatJSON } from "@/lib/mistral";
import {
  ResumeTranslationSchema,
  type ResumeTranslation,
} from "@/lib/validators/job";
import { LANGUAGE_NAMES, type Locale } from "@/constants";
import type { ResumeJson } from "@/types/job";

type ResumeEntry = ResumeJson["experiences"][number];
type TranslatedEntry = ResumeTranslation["experiences"][number];

function mergeTranslatedEntries(
  translated: TranslatedEntry[],
  sources: ResumeEntry[],
): ResumeEntry[] {
  const byIndex = new Map(translated.map((entry) => [entry.index, entry]));

  return sources.map((source, index) => {
    const entry = byIndex.get(index);
    return {
      ...source,
      role: entry?.role || source.role,
      description: entry?.description || source.description,
    };
  });
}

function toIndexedEntries(entries: ResumeEntry[]) {
  return entries.map((entry, index) => ({
    index,
    role: entry.role,
    description: entry.description,
  }));
}

export function mergeResumeTranslation(
  source: ResumeJson,
  translation: ResumeTranslation,
): ResumeJson {
  return {
    summary: translation.summary || source.summary,
    experiences: mergeTranslatedEntries(
      translation.experiences,
      source.experiences ?? [],
    ),
    education: mergeTranslatedEntries(
      translation.education,
      source.education ?? [],
    ),
    skills: (source.skills ?? []).map(
      (skill, index) => translation.skills[index] || skill,
    ),
  };
}

export async function translateResumeJson(params: {
  userId: string | null;
  resumeJson: ResumeJson;
  language: Locale;
}): Promise<ResumeJson> {
  const languageName = LANGUAGE_NAMES[params.language];

  const system = [
    `You are a professional resume translator. Rewrite the resume in ${languageName}.`,
    `ABSOLUTE RULES: translate only — never invent, never add, never remove, never reword facts. Keep the exact same meaning, tone and level of detail as the source.`,
    `Any text already written in ${languageName} must be returned unchanged.`,
    "Never translate proper nouns: people, company, school, product, tool and technology names stay exactly as they are.",
    "Keep job titles idiomatic for the target language rather than literal.",
    "Echo back the index of every entry you receive so it can be matched with its source, and return every entry — never drop, merge or reorder one.",
    "Return the skills array with exactly the same number of items, in the same order.",
    "Return a JSON object with keys: summary (string), experiences (array of {index, role, description}), education (array of {index, role, description}), skills (string array).",
    "No markdown, no commentary, no extra text.",
  ].join(" ");

  const user = JSON.stringify({
    target_language: languageName,
    resume: {
      summary: params.resumeJson.summary,
      experiences: toIndexedEntries(params.resumeJson.experiences ?? []),
      education: toIndexedEntries(params.resumeJson.education ?? []),
      skills: params.resumeJson.skills ?? [],
    },
  });

  const output = await chatJSON({
    operation: "resume_translation",
    userId: params.userId,
    schema: ResumeTranslationSchema,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  return mergeResumeTranslation(params.resumeJson, output);
}
