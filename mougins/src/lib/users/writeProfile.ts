import type { SupabaseClient } from "@supabase/supabase-js";
import type { UpdateUserInput } from "@/lib/validators/user";

/** Postgres unique-violation — surfaces as "pseudo already taken". */
export const UNIQUE_VIOLATION = "23505";

const EXPERIENCE_FIELDS = [
  ["professionalExperiences", "professional"],
  ["educationalExperiences", "educational"],
  ["personalExperiences", "personal"],
] as const;

/**
 * One experience as this function writes it. Structural rather than tied to a
 * single schema, so both sources fit: the profile form's validated output
 * (where `website` is always present, possibly undefined) and a parsed CV
 * (which has no `website` key at all).
 */
interface ExperiencePatch {
  organization: string;
  role: string;
  startPeriod: number;
  endPeriod?: number;
  description?: string;
  location?: string;
  website?: string;
}

/** A profile patch: the validated update shape, with experiences widened. */
export type ProfilePatch = Omit<
  UpdateUserInput,
  "professionalExperiences" | "educationalExperiences" | "personalExperiences"
> & {
  professionalExperiences?: ExperiencePatch[];
  educationalExperiences?: ExperiencePatch[];
  personalExperiences?: ExperiencePatch[];
};

/**
 * Write a validated profile patch for `userId`.
 *
 * The single implementation behind `PATCH /api/users/me` **and** the signup
 * claim that copies an anonymous visitor's CV onto their new account. Both need
 * identical semantics, and two copies of this would drift.
 *
 * ⚠️ Collections are **replaced, not merged**: every array present in `patch`
 * deletes the user's existing rows of that kind and re-inserts the payload in
 * order. Absent keys are left untouched. Callers holding a partial list must
 * merge before calling.
 *
 * Takes the client so the caller picks the trust level: the route passes its
 * RLS-scoped client (the user may only touch their own row), the signup claim
 * passes the admin client because it runs before the session cookie is readable.
 *
 * Throws on failure; a `UNIQUE_VIOLATION` code means the pseudo is taken.
 */
export async function writeProfile(
  supabase: SupabaseClient,
  userId: string,
  patch: ProfilePatch,
): Promise<void> {
  const core: Record<string, unknown> = {};
  const set = (key: string, value: unknown) => {
    if (value !== undefined) core[key] = value;
  };

  set("first_name", patch.firstName);
  set("last_name", patch.lastName);
  set("pseudo", patch.pseudo);
  set("gender", patch.gender);
  set("onboarding_completed", patch.onboardingCompleted);
  if (patch.dob !== undefined) {
    core.dob = new Date(patch.dob).toISOString().slice(0, 10);
  }
  // Nullable text fields: an explicit null clears them.
  if (patch.phone !== undefined) core.phone = patch.phone ?? null;
  if (patch.nationality !== undefined) core.nationality = patch.nationality ?? null;
  if (patch.location !== undefined) core.location = patch.location ?? null;
  if (patch.bio !== undefined) core.bio = patch.bio ?? null;
  if (patch.profilePhoto !== undefined) {
    core.profile_photo = patch.profilePhoto || null;
  }

  if (Object.keys(core).length > 0) {
    const { error } = await supabase.from("users").update(core).eq("id", userId);
    if (error) throw error;
  }

  for (const [key, type] of EXPERIENCE_FIELDS) {
    const entries = patch[key];
    if (entries === undefined) continue;

    const { error } = await supabase
      .from("user_experiences")
      .delete()
      .eq("user_id", userId)
      .eq("type", type);
    if (error) throw error;
    if (entries.length === 0) continue;

    const { error: insertError } = await supabase.from("user_experiences").insert(
      entries.map((exp, i) => ({
        user_id: userId,
        type,
        organization: exp.organization,
        role: exp.role,
        start_period: exp.startPeriod,
        end_period: exp.endPeriod ?? null,
        description: exp.description ?? null,
        website: exp.website ?? null,
        location: exp.location ?? null,
        position: i,
      })),
    );
    if (insertError) throw insertError;
  }

  /** Replace a simple child table whose rows are `{ [column]: value, position }`. */
  const replaceList = async (
    table: string,
    column: string,
    values: string[] | undefined,
  ) => {
    if (values === undefined) return;
    const { error } = await supabase.from(table).delete().eq("user_id", userId);
    if (error) throw error;
    if (values.length === 0) return;
    const { error: insertError } = await supabase
      .from(table)
      .insert(values.map((value, i) => ({ user_id: userId, [column]: value, position: i })));
    if (insertError) throw insertError;
  };

  await replaceList("user_skills", "name", patch.skills);
  await replaceList("user_projects", "url", patch.projects);
  await replaceList("user_social_networks", "url", patch.socialNetworks);

  if (patch.hobbies !== undefined) {
    const { error } = await supabase
      .from("user_hobbies")
      .delete()
      .eq("user_id", userId);
    if (error) throw error;
    if (patch.hobbies.length > 0) {
      const { error: insertError } = await supabase.from("user_hobbies").insert(
        patch.hobbies.map((h, i) => ({
          user_id: userId,
          title: h.title,
          description: h.description,
          position: i,
        })),
      );
      if (insertError) throw insertError;
    }
  }
}
