import { createClient } from "@/lib/supabase/server";
import type {
  AnalysisJob,
  AnalysisListItem,
  OptimizedResume,
  ResumeVersion,
} from "@/types/job";

/** History of the current user's analyses, newest first (RLS-scoped). */
export async function getAnalysisHistory(): Promise<AnalysisListItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("analyses")
    .select(
      `id, job_id, matching_score, confidence_score, strengths, weaknesses,
       missing_skills, recommendations, summary, created_at,
       job:job_id ( title, company, location, source_url )`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((a) => ({
    id: a.id,
    job_id: a.job_id,
    matching_score: Number(a.matching_score),
    confidence_score: Number(a.confidence_score),
    strengths: (a.strengths as string[]) ?? [],
    weaknesses: (a.weaknesses as string[]) ?? [],
    missing_skills: (a.missing_skills as string[]) ?? [],
    recommendations: (a.recommendations as string[]) ?? [],
    summary: a.summary,
    created_at: a.created_at,
    job: (a.job as unknown) as AnalysisListItem["job"],
  }));
}

/** Current state of an analysis job, for status polling / Realtime fallback. */
export async function getAnalysisJobById(
  id: string,
): Promise<AnalysisJob | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("analysis_jobs")
    .select(
      `id, user_id, job_id, source_url, status, current_step, progress,
       analysis_id, error_message, created_at`,
    )
    .eq("id", id)
    .single();
  return (data as AnalysisJob | null) ?? null;
}

/** An optimized resume plus its version history (RLS-scoped). */
export async function getResumeById(id: string): Promise<{
  resume: OptimizedResume;
  versions: ResumeVersion[];
} | null> {
  const supabase = await createClient();

  const { data: resume } = await supabase
    .from("optimized_resumes")
    .select(
      `id, job_id, analysis_id, version, resume_json, ats_score, is_active, created_at`,
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!resume) return null;

  const { data: versions } = await supabase
    .from("resume_versions")
    .select("id, version_number, resume_json, diff_summary, created_at")
    .eq("resume_id", id)
    .order("version_number", { ascending: false });

  return {
    resume: resume as unknown as OptimizedResume,
    versions: (versions as unknown as ResumeVersion[]) ?? [],
  };
}
