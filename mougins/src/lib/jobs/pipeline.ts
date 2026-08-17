import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_CHAT_MODEL, embed } from "@/lib/mistral";
import { PROMPT_VERSION, type Locale } from "@/constants";
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

const CHAT_MODEL = process.env.MISTRAL_CHAT_MODEL || DEFAULT_CHAT_MODEL;

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

export async function runAnalysisPipeline(analysisJobId: string): Promise<void> {
  const admin = createAdminClient();

  const setStep = (step: AnalysisStep, progress: number) =>
    admin
      .from("analysis_jobs")
      .update({ current_step: step, progress })
      .eq("id", analysisJobId);

  const { data: jobRow } = await admin
    .from("analysis_jobs")
    .select(
      "id, user_id, anon_id, source_url, job_text, cv_extraction, expires_at, locale",
    )
    .eq("id", analysisJobId)
    .single();

  if (!jobRow) return;

  const userId = jobRow.user_id as string | null;
  const anonId = jobRow.anon_id as string | null;
  const expiresAt = jobRow.expires_at as string | null;
  const cvExtraction = jobRow.cv_extraction as CvExtraction | null;
  const locale = jobRow.locale as Locale;

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

    const rawText = jobRow.job_text as string | null;
    const sourceUrl = jobRow.source_url as string | null;
    const job = rawText
      ? await extractJobFromText(rawText, userId, sourceUrl)
      : await extractJob(sourceUrl!, userId);
    await admin
      .from("analysis_jobs")
      .update({ job_id: job.id })
      .eq("id", analysisJobId);

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
      locale,
    });

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
        prep_points: explanation.prep_points,
        recruiter_questions: explanation.recruiter_questions,
        summary: explanation.summary,
        cover_letter: coverLetter || null,
        locale,
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

    await setStep("OPTIMIZING_RESUME", 70);
    await optimizeResume({ userId, owner, job, profile, analysisId });

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
