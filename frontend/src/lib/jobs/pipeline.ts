import { createAdminClient } from "@/lib/supabase/admin";
import { embed } from "@/lib/mistral";
import { PROMPT_VERSION } from "@/constants";
import type { AnalysisStep } from "@/types/job";
import { extractJob } from "./extract";
import { getCandidateProfile, profileToText } from "./profile";
import {
  computeFinalScore,
  cosineSimilarity,
  getMatchingExplanation,
} from "./matching";
import { optimizeResume } from "./optimizeResume";

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
    .select("id, user_id, source_url")
    .eq("id", analysisJobId)
    .single();

  if (!jobRow) return;
  const userId = jobRow.user_id as string;

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

    // 1. Extract the job posting.
    const job = await extractJob(jobRow.source_url as string, userId);
    await admin
      .from("analysis_jobs")
      .update({ job_id: job.id })
      .eq("id", analysisJobId);

    // 2. Match against the candidate profile (hybrid score + LLM explanation).
    await setStep("MATCHING_PROFILE", 40);
    const profile = await getCandidateProfile(userId);

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

    const breakdown = computeFinalScore({
      jobSkills: job.skills,
      profile,
      jobSeniority: job.seniority,
      semanticSimilarity,
    });

    const explanation = await getMatchingExplanation({
      userId,
      job,
      profile,
      breakdown,
    });

    const { data: analysis } = await admin
      .from("analyses")
      .insert({
        user_id: userId,
        job_id: job.id,
        matching_score: breakdown.final,
        confidence_score: Math.round(breakdown.semantic * 100),
        strengths: explanation.strengths,
        weaknesses: explanation.weaknesses,
        missing_skills: explanation.missing_skills,
        recommendations: explanation.recommendations,
        summary: explanation.summary,
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
    await optimizeResume({ userId, job, profile, analysisId });

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
