import type { Experience } from "@/types/experience";
import type { UserData } from "@/types/user";
import type { ResumeJson } from "@/types/job";

function toResumeEntry(e: Experience): ResumeJson["experiences"][number] {
  return {
    organization: e.organization,
    role: e.role,
    startPeriod: e.startPeriod,
    endPeriod: e.endPeriod,
    location: e.location,
    description: e.description ?? "",
  };
}

export function profileToResumeJson(profile: UserData): ResumeJson {
  return {
    summary: profile.bio ?? "",
    experiences: (profile.professional_experiences ?? []).map(toResumeEntry),
    education: (profile.educational_experiences ?? []).map(toResumeEntry),
    skills: profile.skills ?? [],
  };
}
