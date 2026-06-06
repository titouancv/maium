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
    "Always write the entire output in English, even if the candidate data is in another language: translate every field (summary, experiences, education, skills) into English.",
    "ABSOLUTE RULES: never invent, never add, never modify facts.",
    "You may ONLY rephrase, reorganize, optimize for ATS keywords, and highlight existing skills/experience.",
    "Every skill, experience and education entry in your output MUST come from the candidate data.",
    "For each output experience, set source_index to the 0-based index of the matching candidate.experiences entry, and write description as a single optimized prose paragraph (NOT a bullet list).",
    "For each output education entry, set source_index to the 0-based index of the matching candidate.education entry, and write description as a single optimized prose paragraph (NOT a bullet list) that highlights relevant coursework, achievements or skills for the job.",
    "You may reorder and drop experiences and education, but never duplicate a source_index within the same array.",
    "Return a JSON object with keys: summary, experiences (array of {source_index, organization, role, description}), education (array of {source_index, organization, role, description}), skills (string array), ats_score (0-100).",
  ].join(" ");

  const user = JSON.stringify({
    job: {
      title: params.job.title,
      skills: params.job.skills,
      requirements: params.job.requirements,
      seniority: params.job.seniority,
    },
    candidate: {
      ...params.profile,
      experiences: params.profile.experiences.map((e, index) => ({
        index,
        organization: e.organization,
        role: e.role,
        description: e.description,
      })),
      education: params.profile.education.map((e, index) => ({
        index,
        organization: e.organization,
        role: e.role,
        description: e.description,
      })),
    },
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

  // Merge the model's optimized wording with the immutable facts (dates,
  // location) read from the matching candidate experience via source_index.
  const experiences: ResumeJson["experiences"] = output.experiences.flatMap(
    (e) => {
      const src = params.profile.experiences[e.source_index];
      if (!src) return [];
      return [
        {
          organization: e.organization || src.organization,
          role: e.role || src.role,
          startPeriod: src.startPeriod,
          endPeriod: src.endPeriod,
          location: src.location,
          description: e.description,
        },
      ];
    },
  );

  // Same merge for education: the model rewrites the description while dates,
  // location, organization and role stay sourced from the candidate profile.
  const education: ResumeJson["education"] = output.education.flatMap((e) => {
    const src = params.profile.education[e.source_index];
    if (!src) return [];
    return [
      {
        organization: e.organization || src.organization,
        role: e.role || src.role,
        startPeriod: src.startPeriod,
        endPeriod: src.endPeriod,
        location: src.location,
        description: e.description,
      },
    ];
  });

  const resumeJson: ResumeJson = {
    summary: output.summary,
    experiences,
    education,
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
