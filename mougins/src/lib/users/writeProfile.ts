import type { SupabaseClient } from "@supabase/supabase-js";
import type { UpdateUserInput } from "@/lib/validators/user";

export const UNIQUE_VIOLATION = "23505";

const EXPERIENCE_FIELDS = [
  ["professionalExperiences", "professional"],
  ["educationalExperiences", "educational"],
  ["personalExperiences", "personal"],
] as const;

interface ExperiencePatch {
  organization: string;
  role: string;
  startPeriod: number;
  endPeriod?: number;
  description?: string;
  location?: string;
  website?: string;
}

export type ProfilePatch = Omit<
  UpdateUserInput,
  "professionalExperiences" | "educationalExperiences" | "personalExperiences"
> & {
  professionalExperiences?: ExperiencePatch[];
  educationalExperiences?: ExperiencePatch[];
  personalExperiences?: ExperiencePatch[];
};

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
  set("email_notifications", patch.emailNotifications);
  set("locale", patch.locale);
  if (patch.dob !== undefined) {
    core.dob = new Date(patch.dob).toISOString().slice(0, 10);
  }
  if (patch.phone !== undefined) core.phone = patch.phone ?? null;
  if (patch.nationality !== undefined)
    core.nationality = patch.nationality ?? null;
  if (patch.location !== undefined) core.location = patch.location ?? null;
  if (patch.bio !== undefined) core.bio = patch.bio ?? null;
  if (patch.profilePhoto !== undefined) {
    core.profile_photo = patch.profilePhoto || null;
  }
  set("dream_company_types", patch.dreamCompanyTypes);
  set("dream_work_mode", patch.dreamWorkMode);
  if (patch.dreamLocation !== undefined)
    core.dream_location = patch.dreamLocation || null;
  if (patch.dreamSalary !== undefined) core.dream_salary = patch.dreamSalary ?? null;
  set("dream_industries", patch.dreamIndustries);
  if (patch.dreamCompanyValues !== undefined)
    core.dream_company_values = patch.dreamCompanyValues || null;

  if (Object.keys(core).length > 0) {
    const { error } = await supabase
      .from("users")
      .update(core)
      .eq("id", userId);
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

    const { error: insertError } = await supabase
      .from("user_experiences")
      .insert(
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
      .insert(
        values.map((value, i) => ({
          user_id: userId,
          [column]: value,
          position: i,
        })),
      );
    if (insertError) throw insertError;
  };

  await replaceList("user_skills", "name", patch.skills);
  await replaceList("user_social_networks", "url", patch.socialNetworks);

  if (patch.projects !== undefined) {
    const { error } = await supabase
      .from("user_projects")
      .delete()
      .eq("user_id", userId);
    if (error) throw error;
    if (patch.projects.length > 0) {
      const { error: insertError } = await supabase.from("user_projects").insert(
        patch.projects.map((p, i) => ({
          user_id: userId,
          title: p.title,
          bio: p.bio ?? null,
          website_url: p.websiteUrl ?? null,
          github_url: p.githubUrl ?? null,
          image_url: p.imageUrl ?? null,
          image_path: p.imagePath ?? null,
          position: i,
        })),
      );
      if (insertError) throw insertError;
    }
  }

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
          category: h.category,
          image_url: h.imageUrl ?? null,
          source_url: h.sourceUrl ?? null,
          position: i,
        })),
      );
      if (insertError) throw insertError;
    }
  }
}
