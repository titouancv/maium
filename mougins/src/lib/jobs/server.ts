import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequester, ownsRow, type OwnedRow } from "./access";
import type {
  AnalysisJob,
  AnalysisListItem,
  OptimizedResume,
  ResumeVersion,
} from "@/types/job";

/**
 * History of the current user's analyses, newest first (RLS-scoped).
 *
 * `limit` caps the rows fetched — the home dashboard only previews the latest
 * few, while the history page passes nothing and gets everything.
 */
export async function getAnalysisHistory(
  limit?: number,
): Promise<AnalysisListItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const query = supabase
    .from("analyses")
    .select(
      `id, job_id, matching_score, confidence_score, strengths, weaknesses,
       missing_skills, recommendations, summary, cover_letter, created_at,
       job:job_id ( title, company, location, source_url ),
       resume:optimized_resumes!analysis_id ( id, is_active, deleted_at )`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data } = await (limit === undefined ? query : query.limit(limit));

  if (!data) return [];

  return data.map((a) => {
    const resumes = (a.resume as { id: string; is_active: boolean; deleted_at: string | null }[]) ?? [];
    const activeResume = resumes.find((r) => r.is_active && !r.deleted_at);
    return {
      id: a.id,
      job_id: a.job_id,
      matching_score: Number(a.matching_score),
      confidence_score: Number(a.confidence_score),
      strengths: (a.strengths as string[]) ?? [],
      weaknesses: (a.weaknesses as string[]) ?? [],
      missing_skills: (a.missing_skills as string[]) ?? [],
      recommendations: (a.recommendations as string[]) ?? [],
      summary: a.summary,
      cover_letter: a.cover_letter,
      created_at: a.created_at,
      job: a.job as unknown as AnalysisListItem["job"],
      resume_id: activeResume?.id ?? null,
    };
  });
}

/**
 * A single finished analysis with its job and active resume, scoped to its
 * owner. Same shape as a history row, so the signed-out result screen can
 * reuse the components the history list already feeds.
 */
export async function getAnalysisById(
  id: string,
): Promise<AnalysisListItem | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("analyses")
    .select(
      `id, user_id, anon_id, job_id, matching_score, confidence_score, strengths,
       weaknesses, missing_skills, recommendations, summary, cover_letter, created_at,
       job:job_id ( title, company, location, source_url ),
       resume:optimized_resumes!analysis_id ( id, is_active, deleted_at )`,
    )
    .eq("id", id)
    .single();

  if (!data) return null;
  if (!ownsRow(data as OwnedRow, await getRequester())) return null;

  const resumes =
    (data.resume as { id: string; is_active: boolean; deleted_at: string | null }[]) ??
    [];
  const activeResume = resumes.find((r) => r.is_active && !r.deleted_at);

  return {
    id: data.id,
    job_id: data.job_id,
    matching_score: Number(data.matching_score),
    confidence_score: Number(data.confidence_score),
    strengths: (data.strengths as string[]) ?? [],
    weaknesses: (data.weaknesses as string[]) ?? [],
    missing_skills: (data.missing_skills as string[]) ?? [],
    recommendations: (data.recommendations as string[]) ?? [],
    summary: data.summary,
    cover_letter: data.cover_letter,
    created_at: data.created_at,
    job: data.job as unknown as AnalysisListItem["job"],
    resume_id: activeResume?.id ?? null,
  };
}

/**
 * Current state of an analysis job, for status polling / Realtime fallback.
 *
 * Read with the service-role client and authorized explicitly via
 * {@link ownsRow}, because a signed-out run's rows carry a NULL `user_id` and
 * no RLS policy can match them. Returns `null` for a row the caller doesn't
 * own, so the route answers 404 either way and never confirms it exists.
 */
export async function getAnalysisJobById(
  id: string,
): Promise<AnalysisJob | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("analysis_jobs")
    .select(
      `id, user_id, anon_id, job_id, source_url, status, current_step, progress,
       analysis_id, error_message, created_at`,
    )
    .eq("id", id)
    .single();

  if (!data) return null;
  if (!ownsRow(data as OwnedRow, await getRequester())) return null;
  return data as unknown as AnalysisJob;
}

/** An optimized resume plus its version history, scoped to its owner. */
export async function getResumeById(id: string): Promise<{
  resume: OptimizedResume;
  versions: ResumeVersion[];
} | null> {
  const admin = createAdminClient();

  const { data: resume } = await admin
    .from("optimized_resumes")
    .select(
      `id, user_id, anon_id, job_id, analysis_id, version, resume_json, ats_score,
       is_active, created_at`,
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!resume) return null;
  if (!ownsRow(resume as OwnedRow, await getRequester())) return null;

  const { data: versions } = await admin
    .from("resume_versions")
    .select("id, version_number, resume_json, diff_summary, created_at")
    .eq("resume_id", id)
    .order("version_number", { ascending: false });

  return {
    resume: resume as unknown as OptimizedResume,
    versions: (versions as unknown as ResumeVersion[]) ?? [],
  };
}
