import { createAdminClient } from "@/lib/supabase/admin";
import { chatJSON } from "@/lib/mistral";
import { OptimizedResumeSchema } from "@/lib/validators/job";
import type { CandidateProfile, JobData, ResumeJson } from "@/types/job";

/**
 * Generates an ATS-optimized resume tailored to a job and persists it
 * (`optimized_resumes` + its first `resume_versions` row). Hard constraint:
 * the model may only rephrase, reorder and surface existing facts — never
 * invent, add or alter experience.
 */
export async function optimizeResume(params: {
  userId: string;
  job: JobData;
  profile: CandidateProfile;
  analysisId: string;
}): Promise<{ resumeId: string; resumeJson: ResumeJson; atsScore: number }> {
  const admin = createAdminClient();

  const system = [
    "You are an ATS resume optimizer.",
    "Rewrite the candidate's resume to target the given job.",
    "ABSOLUTE RULES: never invent, never add, never modify facts.",
    "You may ONLY rephrase, reorganize, optimize for ATS keywords, and highlight existing skills/experience.",
    "Every skill and experience in your output MUST come from the candidate data.",
    "Return a JSON object with keys: headline, summary, experiences (array of {organization, role, highlights[]}), skills (string array), ats_score (0-100).",
  ].join(" ");

  const user = JSON.stringify({
    job: {
      title: params.job.title,
      skills: params.job.skills,
      requirements: params.job.requirements,
      seniority: params.job.seniority,
    },
    candidate: params.profile,
  });

  const output = await chatJSON({
    operation: "resume_optimization",
    userId: params.userId,
    schema: OptimizedResumeSchema,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const resumeJson: ResumeJson = {
    headline: output.headline,
    summary: output.summary,
    experiences: output.experiences,
    skills: output.skills,
  };

  const { data: resume, error } = await admin
    .from("optimized_resumes")
    .insert({
      user_id: params.userId,
      job_id: params.job.id,
      analysis_id: params.analysisId,
      version: 1,
      resume_json: resumeJson,
      ats_score: output.ats_score,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !resume) {
    throw new Error(`Failed to store optimized resume: ${error?.message ?? "unknown"}`);
  }

  await admin.from("resume_versions").insert({
    resume_id: resume.id,
    version_number: 1,
    resume_json: resumeJson,
    diff_summary: "Initial optimized version.",
  });

  return { resumeId: resume.id, resumeJson, atsScore: output.ats_score };
}
