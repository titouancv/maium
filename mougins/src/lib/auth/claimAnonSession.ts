import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeProfile, type ProfilePatch } from "@/lib/users/writeProfile";
import { CvExtractionSchema, type CvExtraction } from "@/lib/validators/cv";
import { clearAnonSession, getAnonId } from "./anonSession";

/** Pipeline tables that carry an anonymous owner. */
const OWNED_TABLES = ["analysis_jobs", "analyses", "optimized_resumes"] as const;

/** Everything the claim needs to know before touching an existing profile. */
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

/** True when the account has nothing in this text column yet. */
const blank = (value: string | null) => !value || value.trim() === "";

/**
 * The slice of a parsed CV that can be written without destroying anything.
 *
 * `writeProfile` **replaces** every collection it is handed, so a key is kept
 * only when the account has nothing there yet. This is what keeps the claim safe
 * for someone signing back into an existing account: their skills, experiences
 * and bio outrank a CV they uploaded while signed out.
 *
 * `firstName` / `lastName` are never carried over — Google already supplied them
 * and is the more reliable source.
 */
function fillableFromCv(cv: CvExtraction, existing: ExistingProfile): ProfilePatch {
  const patch: ProfilePatch = {};

  if (cv.phone && blank(existing.phone)) patch.phone = cv.phone;
  if (cv.nationality && blank(existing.nationality)) patch.nationality = cv.nationality;
  if (cv.location && blank(existing.location)) patch.location = cv.location;
  if (cv.bio && blank(existing.bio)) patch.bio = cv.bio;

  // Experiences live in one table keyed by `type`, and are replaced per type.
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

/**
 * Copy the CV parsed during the anonymous run onto the account — but only into
 * the gaps.
 *
 * Two guards, because the same OAuth callback serves a brand-new signup and a
 * returning user signing back in:
 *
 *  1. An account that finished onboarding is left alone entirely. It has a
 *     profile the user curated; a CV dropped into `/analyze` doesn't get to
 *     rewrite it.
 *  2. Otherwise only the empty fields are filled, so a half-finished wizard
 *     still benefits without losing what it already holds.
 *
 * Fails closed: if the profile can't be read, nothing is written.
 */
async function importCvIntoProfile(
  admin: SupabaseClient,
  userId: string,
  anonId: string,
): Promise<void> {
  // The CV from their most recent run. Re-validated rather than trusted: it
  // was written from a request body, and it is about to become profile data.
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

/**
 * Hand a signed-out visitor's work to the account they just signed into.
 *
 * This is what makes the one-free-analysis limit acceptable: they don't
 * re-upload their CV or lose the analysis that convinced them to sign up. Two
 * halves:
 *
 *  1. The CV parsed during their run fills the *gaps* in the profile, so a fresh
 *     signup has only pseudo / date of birth / gender left to answer while an
 *     existing account keeps everything it already had (see
 *     `importCvIntoProfile`).
 *  2. Their analysis, resume and job rows are reassigned to the account and
 *     lose their expiry, becoming permanent history — this part runs for every
 *     account, new or not.
 *
 * Best-effort by design: it runs inside the OAuth callback, and a failure here
 * must never cost the user their sign-in. The worst case is an unclaimed run
 * that expires on schedule.
 *
 * Uses the admin client because the anonymous rows are invisible to RLS (NULL
 * `user_id`) — the cookie is the authorization, checked here.
 */
export async function claimAnonSession(userId: string): Promise<void> {
  try {
    const anonId = await getAnonId();
    if (!anonId) return;

    const admin = createAdminClient();

    await importCvIntoProfile(admin, userId, anonId);

    for (const table of OWNED_TABLES) {
      await admin
        .from(table)
        .update({ user_id: userId, anon_id: null, expires_at: null })
        .eq("anon_id", anonId);
    }

    await clearAnonSession();
  } catch (error) {
    // Never break sign-in over this.
    console.error("[claimAnonSession]", error);
  }
}
