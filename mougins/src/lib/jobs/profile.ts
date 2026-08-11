import { createAdminClient } from "@/lib/supabase/admin";
import {
  mapUserFromDb,
  USER_PROFILE_SELECT,
  type DbUserRaw,
} from "@/lib/mappers/user";
import type { CvExtraction } from "@/lib/validators/cv";
import type { CandidateProfile } from "@/types/job";

/**
 * Assembles the normalized candidate profile for a user, reusing the same
 * relational select + mapper as the public profile page. Uses the admin client
 * because the pipeline runs in a background task without the user's cookies.
 */
export async function getCandidateProfile(
  userId: string,
): Promise<CandidateProfile> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select(`id, bio, ${USER_PROFILE_SELECT}`)
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
    projects: user.projects ?? [],
  };
}

/**
 * The same profile, assembled from a parsed CV instead of a `users` row — the
 * signed-out path, where there is no account to read.
 *
 * A pure mapping, deliberately symmetric with {@link getCandidateProfile}: the
 * pipeline downstream can't tell the two apart. `CvExtraction` is stored rather
 * than `CandidateProfile` because the same JSON also fills the account at
 * signup, and only the extraction shape matches `PATCH /api/users/me`.
 */
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
  };
}

/** Flattens a candidate profile into a single string for embedding. */
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
