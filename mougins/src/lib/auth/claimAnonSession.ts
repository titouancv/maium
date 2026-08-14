import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeProfile, type ProfilePatch } from "@/lib/users/writeProfile";
import { CvExtractionSchema, type CvExtraction } from "@/lib/validators/cv";
import { clearAnonSession, getAnonId } from "./anonSession";

const OWNED_TABLES = ["analysis_jobs", "analyses", "optimized_resumes"] as const;

const EXISTING_PROFILE_SELECT =
  "onboarding_completed, phone, nationality, location, bio, user_experiences(type), user_skills(name), user_projects(url), user_social_networks(url), user_hobbies(title)";

interface ExistingProfile {
  onboarding_completed: boolean | null;
  phone: string | null;
  nationality: string | null;
  location: string | null;
  bio: string | null;
  user_experiences: { type: string }[] | null;
  user_skills: unknown[] | null;
  user_projects: unknown[] | null;
  user_social_networks: unknown[] | null;
  user_hobbies: unknown[] | null;
}

const blank = (value: string | null) => !value || value.trim() === "";

function fillableFromCv(cv: CvExtraction, existing: ExistingProfile): ProfilePatch {
  const patch: ProfilePatch = {};

  if (cv.phone && blank(existing.phone)) patch.phone = cv.phone;
  if (cv.nationality && blank(existing.nationality)) patch.nationality = cv.nationality;
  if (cv.location && blank(existing.location)) patch.location = cv.location;
  if (cv.bio && blank(existing.bio)) patch.bio = cv.bio;

  const types = new Set((existing.user_experiences ?? []).map((e) => e.type));
  if (cv.professionalExperiences?.length && !types.has("professional")) {
    patch.professionalExperiences = cv.professionalExperiences;
  }
  if (cv.educationalExperiences?.length && !types.has("educational")) {
    patch.educationalExperiences = cv.educationalExperiences;
  }
  if (cv.personalExperiences?.length && !types.has("personal")) {
    patch.personalExperiences = cv.personalExperiences;
  }

  if (cv.skills?.length && !existing.user_skills?.length) patch.skills = cv.skills;
  if (cv.projects?.length && !existing.user_projects?.length) patch.projects = cv.projects;
  if (cv.socialNetworks?.length && !existing.user_social_networks?.length) {
    patch.socialNetworks = cv.socialNetworks;
  }
  if (cv.hobbies?.length && !existing.user_hobbies?.length) patch.hobbies = cv.hobbies;

  return patch;
}

async function importCvIntoProfile(
  admin: SupabaseClient,
  userId: string,
  anonId: string,
): Promise<void> {
  const { data: job } = await admin
    .from("analysis_jobs")
    .select("cv_extraction")
    .eq("anon_id", anonId)
    .not("cv_extraction", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const parsed = CvExtractionSchema.safeParse(job?.cv_extraction);
  if (!parsed.success) return;

  const { data, error } = await admin
    .from("users")
    .select(EXISTING_PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  const existing = data as unknown as ExistingProfile | null;
  if (error || !existing || existing.onboarding_completed) return;

  const patch = fillableFromCv(parsed.data, existing);
  if (Object.keys(patch).length > 0) {
    await writeProfile(admin, userId, patch);
  }
}

export async function claimAnonSession(userId: string): Promise<boolean> {
  try {
    const anonId = await getAnonId();
    if (!anonId) return false;

    const admin = createAdminClient();

    await importCvIntoProfile(admin, userId, anonId);

    for (const table of OWNED_TABLES) {
      await admin
        .from(table)
        .update({ user_id: userId, anon_id: null, expires_at: null })
        .eq("anon_id", anonId);
    }

    await clearAnonSession();
    return true;
  } catch (error) {
    console.error("[claimAnonSession]", error);
    return false;
  }
}
