import { createAdminClient } from "@/lib/supabase/admin";
import { writeProfile, type ProfilePatch } from "@/lib/users/writeProfile";
import { CvExtractionSchema } from "@/lib/validators/cv";
import { clearAnonSession, getAnonId } from "./anonSession";

/** Pipeline tables that carry an anonymous owner. */
const OWNED_TABLES = ["analysis_jobs", "analyses", "optimized_resumes"] as const;

/**
 * Hand a signed-out visitor's work to the account they just created.
 *
 * This is what makes the one-free-analysis limit acceptable: they don't
 * re-upload their CV or lose the analysis that convinced them to sign up. Two
 * halves:
 *
 *  1. The CV parsed during their run fills the new profile, so the wizard has
 *     only pseudo / date of birth / gender left to ask for.
 *  2. Their analysis, resume and job rows are reassigned to the account and
 *     lose their expiry, becoming permanent history.
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
    if (parsed.success) {
      const profile: ProfilePatch = { ...parsed.data };
      // Google already supplied first/last name on the new row and is the more
      // reliable source, so the CV's version is dropped rather than applied.
      delete profile.firstName;
      delete profile.lastName;
      if (Object.keys(profile).length > 0) {
        await writeProfile(admin, userId, profile);
      }
    }

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
