import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UpdateAnalysisTracking } from "@/lib/validators/job";
import { getRequester, ownsRow, type OwnedRow } from "./access";
import type {
  AnalysisJob,
  AnalysisListItem,
  OptimizedResume,
  PrepPoint,
  ResumeVersion,
} from "@/types/job";

const ANALYSIS_SELECT = `id, job_id, matching_score, confidence_score,
  prep_points, recruiter_questions, summary, cover_letter, status,
  status_changed_at, snooze_days, notes, created_at,
  job:job_id ( title, company, location, source_url ),
  resume:optimized_resumes!analysis_id ( id, is_active, deleted_at )`;

interface AnalysisRowResume {
  id: string;
  is_active: boolean;
  deleted_at: string | null;
}

function mapAnalysisRow(row: Record<string, unknown>): AnalysisListItem {
  const resumes = (row.resume as AnalysisRowResume[]) ?? [];
  const activeResume = resumes.find((r) => r.is_active && !r.deleted_at);

  return {
    id: row.id as string,
    job_id: row.job_id as string,
    matching_score: Number(row.matching_score),
    confidence_score: Number(row.confidence_score),
    prep_points: (row.prep_points as PrepPoint[]) ?? [],
    recruiter_questions: (row.recruiter_questions as string[]) ?? [],
    summary: row.summary as string | null,
    cover_letter: row.cover_letter as string | null,
    status: row.status as AnalysisListItem["status"],
    status_changed_at: row.status_changed_at as string | null,
    snooze_days: row.snooze_days as number | null,
    notes: row.notes as string | null,
    created_at: row.created_at as string,
    job: row.job as AnalysisListItem["job"],
    resume_id: activeResume?.id ?? null,
  };
}

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
    .select(ANALYSIS_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data } = await (limit === undefined ? query : query.limit(limit));

  if (!data) return [];

  return data.map(mapAnalysisRow);
}

export async function getAnalysisById(
  id: string,
): Promise<AnalysisListItem | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("analyses")
    .select(`user_id, anon_id, ${ANALYSIS_SELECT}`)
    .eq("id", id)
    .single();

  if (!data) return null;
  if (!ownsRow(data as OwnedRow, await getRequester())) return null;

  return mapAnalysisRow(data);
}

export async function updateAnalysisTracking(
  analysisId: string,
  patch: UpdateAnalysisTracking,
): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("analyses")
    .update(patch)
    .eq("id", analysisId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) throw error;

  return Boolean(data);
}

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
