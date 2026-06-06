import { createClient } from "@/lib/supabase/server";
import { getResumeById } from "@/lib/jobs/server";
import type { ResumePdfData } from "./types";

/**
 * Assembles the data a resume template needs: the optimized `resume_json`
 * (RLS-scoped via `getResumeById`) plus the owner's header fields and
 * education, read from the authenticated user's own `public.users` row.
 * Returns `null` when the resume does not exist or isn't visible to the user.
 */
export async function buildResumePdfData(
  resumeId: string,
): Promise<ResumePdfData | null> {
  const result = await getResumeById(resumeId);
  if (!result) return null;

  const { resume_json } = result.resume;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select(
      `first_name, last_name, email, phone, location,
       user_experiences(type, organization, role, position)`,
    )
    .eq("id", user.id)
    .single();

  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const education = (
    (profile?.user_experiences as
      | { type: string; organization: string; role: string; position: number }[]
      | undefined) ?? []
  )
    .filter((e) => e.type === "educational")
    .sort((a, b) => a.position - b.position)
    .map((e) => ({ organization: e.organization, role: e.role }));

  return {
    fullName: fullName || (profile?.email ?? ""),
    headline: resume_json.headline ?? "",
    contact: {
      email: profile?.email ?? null,
      phone: profile?.phone ?? null,
      location: profile?.location ?? null,
    },
    summary: resume_json.summary ?? "",
    experiences: resume_json.experiences ?? [],
    skills: resume_json.skills ?? [],
    education,
  };
}
