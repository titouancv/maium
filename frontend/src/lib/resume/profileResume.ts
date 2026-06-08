import type { Experience } from "@/types/experience";
import type { UserData } from "@/types/user";
import type { ResumeJson } from "@/types/job";

// Pure, client-safe mappers (type-only imports). Kept out of `data.ts` so the
// resume editor can seed its draft client-side without pulling server code.

/** Maps a profile experience to the resume entry shape (description required). */
export function toResumeEntry(e: Experience): ResumeJson["experiences"][number] {
  return {
    organization: e.organization,
    role: e.role,
    startPeriod: e.startPeriod,
    endPeriod: e.endPeriod,
    location: e.location,
    description: e.description ?? "",
  };
}

/**
 * Builds the editor's initial `resume_json` (summary/experiences/education/
 * skills) straight from a profile. Used both as the client editor seed and the
 * server-side default body, so the two never drift apart.
 */
export function profileToResumeJson(profile: UserData): ResumeJson {
  return {
    summary: profile.bio ?? "",
    experiences: (profile.professional_experiences ?? []).map(toResumeEntry),
    education: (profile.educational_experiences ?? []).map(toResumeEntry),
    skills: profile.skills ?? [],
  };
}
