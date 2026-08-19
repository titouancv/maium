import { createAdminClient } from "@/lib/supabase/admin";
import {
  mapUserFromDb,
  USER_PROFILE_SELECT,
  type DbUserRaw,
} from "@/lib/mappers/user";
import type { CvExtraction } from "@/lib/validators/cv";
import type { CandidateDreamJob, CandidateProfile } from "@/types/job";
import type { UserData } from "@/types/user";

function buildDreamJob(user: UserData): CandidateDreamJob | undefined {
  const dreamJob: CandidateDreamJob = {
    companyTypes: user.dream_company_types?.length
      ? user.dream_company_types
      : undefined,
    workMode: user.dream_work_mode ?? undefined,
    location: user.dream_location || undefined,
    salary: user.dream_salary ?? undefined,
    industries: user.dream_industries?.length
      ? user.dream_industries
      : undefined,
    companyValues: user.dream_company_values || undefined,
  };

  return Object.values(dreamJob).some((v) => v !== undefined)
    ? dreamJob
    : undefined;
}

export async function getCandidateProfile(
  userId: string,
): Promise<CandidateProfile> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select(
      `id, bio, dream_company_types, dream_work_mode, dream_location, dream_salary, dream_industries, dream_company_values, ${USER_PROFILE_SELECT}`,
    )
    .eq("id", userId)
    .single();

  const user = mapUserFromDb((data ?? {}) as DbUserRaw);

  return {
    bio: user.bio ?? "",
    experiences: (user.professional_experiences ?? []).map((e) => ({
      organization: e.organization,
      role: e.role,
      startPeriod: e.startPeriod,
      endPeriod: e.endPeriod,
      location: e.location,
      description: e.description ?? "",
    })),
    education: (user.educational_experiences ?? []).map((e) => ({
      organization: e.organization,
      role: e.role,
      startPeriod: e.startPeriod,
      endPeriod: e.endPeriod,
      location: e.location,
      description: e.description ?? "",
    })),
    skills: user.skills ?? [],
    projects: (user.projects ?? []).map((p) =>
      p.bio ? `${p.title}: ${p.bio}` : p.title,
    ),
    hobbies: user.hobbies ?? [],
    dreamJob: buildDreamJob(user),
  };
}

export function cvExtractionToCandidateProfile(
  extraction: CvExtraction,
): CandidateProfile {
  const toEntry = (e: NonNullable<CvExtraction["professionalExperiences"]>[number]) => ({
    organization: e.organization,
    role: e.role,
    startPeriod: e.startPeriod,
    endPeriod: e.endPeriod,
    location: e.location,
    description: e.description ?? "",
  });

  return {
    bio: extraction.bio ?? "",
    experiences: (extraction.professionalExperiences ?? []).map(toEntry),
    education: (extraction.educationalExperiences ?? []).map(toEntry),
    skills: extraction.skills ?? [],
    projects: extraction.projects ?? [],
    hobbies: extraction.hobbies ?? [],
  };
}

export function candidateWithoutHobbies(
  profile: CandidateProfile,
): Omit<CandidateProfile, "hobbies"> {
  return {
    bio: profile.bio,
    experiences: profile.experiences,
    education: profile.education,
    skills: profile.skills,
    projects: profile.projects,
    dreamJob: profile.dreamJob,
  };
}

export function profileToText(profile: CandidateProfile): string {
  const lines: string[] = [];
  if (profile.bio) lines.push(profile.bio);
  for (const e of profile.experiences) {
    lines.push(`${e.role} @ ${e.organization}. ${e.description}`);
  }
  for (const e of profile.education) {
    lines.push(`${e.role} @ ${e.organization}`);
  }
  if (profile.skills.length) lines.push(`Skills: ${profile.skills.join(", ")}`);
  return lines.join("\n");
}
