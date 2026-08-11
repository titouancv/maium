import { createAdminClient } from "@/lib/supabase/admin";
import { embed } from "@/lib/mistral";
import { PROMPT_VERSION } from "@/constants";
import type { AnalysisStep } from "@/types/job";
import type { CvExtraction } from "@/lib/validators/cv";
import { extractJob, extractJobFromText } from "./extract";
import {
  cvExtractionToCandidateProfile,
  getCandidateProfile,
  profileToText,
} from "./profile";
import { cosineSimilarity, getMatchingExplanation } from "./matching";
import { optimizeResume } from "./optimizeResume";
import { generateCoverLetter } from "./coverLetter";

const CHAT_MODEL = process.env.MISTRAL_CHAT_MODEL ?? "mistral-large-latest";

/** pgvector columns come back as a string like "[0.1,0.2]"; normalize to number[]. */
function parseEmbedding(value: unknown): number[] {
  if (Array.isArray(value)) return value as number[];
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as number[];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Runs the full analysis pipeline for a queued `analysis_jobs` row, updating
 * its `current_step`/`progress` at each stage (streamed to the UI via Realtime)
 * and marking it completed/failed at the end. Invoked from `after()` so the
 * HTTP response returns immediately.
 */
export async function runAnalysisPipeline(analysisJobId: string): Promise<void> {
  const admin = createAdminClient();

  const setStep = (step: AnalysisStep, progress: number) =>
    admin
      .from("analysis_jobs")
      .update({ current_step: step, progress })
      .eq("id", analysisJobId);

  const { data: jobRow } = await admin
    .from("analysis_jobs")
    .select("id, user_id, anon_id, source_url, job_text, cv_extraction, expires_at")
    .eq("id", analysisJobId)
    .single();

  if (!jobRow) return;

  // Exactly one owner (DB constraint). `userId` is null for a signed-out run —
  // it only tags `llm_logs` rows there, which allows null.
  const userId = jobRow.user_id as string | null;
  const anonId = jobRow.anon_id as string | null;
  const expiresAt = jobRow.expires_at as string | null;
  const cvExtraction = jobRow.cv_extraction as CvExtraction | null;

  /** Ownership + retention, applied identically to every row we create. */
  const owner = { user_id: userId, anon_id: anonId, expires_at: expiresAt };

  try {
    await admin
      .from("analysis_jobs")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
        current_step: "EXTRACTING_JOB",
        progress: 10,
      })
      .eq("id", analysisJobId);

    // 1. Extract the job posting (URL or pasted text).
    const rawText = jobRow.job_text as string | null;
    const sourceUrl = jobRow.source_url as string | null;
    const job = rawText
      ? await extractJobFromText(rawText, userId)
      : await extractJob(sourceUrl!, userId);
    await admin
      .from("analysis_jobs")
      .update({ job_id: job.id })
      .eq("id", analysisJobId);

    // 2. Match against the candidate profile (hybrid score + LLM explanation).
    // A signed-out run carries its profile as a parsed CV on the row; a
    // signed-in one reads it from the account. Everything downstream is
    // identical from here.
    await setStep("MATCHING_PROFILE", 40);
    const profile = cvExtraction
      ? cvExtractionToCandidateProfile(cvExtraction)
      : await getCandidateProfile(userId!);

    const profileEmbedding = await embed({
      operation: "profile_embedding",
      userId,
      text: profileToText(profile),
    });
    const { data: jobEmbeddingRow } = await admin
      .from("jobs")
      .select("embedding")
      .eq("id", job.id)
      .single();
    const semanticSimilarity = cosineSimilarity(
      profileEmbedding,
      parseEmbedding(jobEmbeddingRow?.embedding),
    );

    const { breakdown, ...explanation } = await getMatchingExplanation({
      userId,
      job,
      profile,
      semanticSimilarity,
    });

    // Best-effort: a cover-letter failure must never sink the whole analysis.
    let coverLetter: string | null = null;
    try {
      coverLetter = await generateCoverLetter({ userId, job, profile });
    } catch {
      coverLetter = null;
    }

    const { data: analysis } = await admin
      .from("analyses")
      .insert({
        ...owner,
        job_id: job.id,
        matching_score: breakdown.final,
        confidence_score: Math.round(breakdown.semantic * 100),
        strengths: explanation.strengths,
        weaknesses: explanation.weaknesses,
        missing_skills: explanation.missing_skills,
        recommendations: explanation.recommendations,
        summary: explanation.summary,
        cover_letter: coverLetter || null,
        model: CHAT_MODEL,
        prompt_version: PROMPT_VERSION,
      })
      .select("id")
      .single();

    const analysisId = analysis?.id as string;
    await admin
      .from("analysis_jobs")
      .update({ analysis_id: analysisId })
      .eq("id", analysisJobId);

    // 3. Optimize the resume for this job.
    await setStep("OPTIMIZING_RESUME", 70);
    await optimizeResume({ userId, owner, job, profile, analysisId });

    // 4. Embeddings already generated during extraction & matching.
    await setStep("GENERATING_EMBEDDINGS", 90);

    await admin
      .from("analysis_jobs")
      .update({
        status: "completed",
        progress: 100,
        completed_at: new Date().toISOString(),
      })
      .eq("id", analysisJobId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown pipeline error";
    await admin
      .from("analysis_jobs")
      .update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", analysisJobId);
  }
}
