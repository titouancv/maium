import { chatJSON } from "@/lib/mistral";
import {
  MatchingExplanationSchema,
  type MatchingExplanation,
} from "@/lib/validators/job";
import type { CandidateProfile, JobData } from "@/types/job";

const WEIGHTS = {
  hardSkills: 0.4,
  seniority: 0.25,
  semantic: 0.2,
  bonus: 0.15,
} as const;

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export interface ScoreBreakdown {
  hardSkills: number;
  seniority: number;
  semantic: number;
  bonus: number;
  final: number;
}

export async function getMatchingExplanation(params: {
  userId: string | null;
  job: JobData;
  profile: CandidateProfile;
  semanticSimilarity: number;
}): Promise<
  { breakdown: ScoreBreakdown } & Omit<MatchingExplanation, "scores">
> {
  const system = [
    "You are an expert recruitment and career-fit analyst specialized in evaluating real-world fit between a candidate and a company/job offer (not ATS scoring).",

    "You receive:",
    "- A candidate profile",
    "- A job posting",

    "Your task is to evaluate how well the candidate fits the company and the job in a real hiring context.",
    "Focus on practical hiring relevance: day-to-day ability to succeed, alignment with expectations, and overall fit with the role and company environment.",

    "## IMPORTANT: Perspective",
    "- Do NOT simulate ATS or keyword-based filtering.",
    "- Do NOT optimize for resume parsing.",
    "- Evaluate real-world employability and job success likelihood.",
    "- Consider implicit expectations in the job (responsibilities, level, autonomy, environment).",

    "## Scoring rules (all scores are floats in [0, 1])",

    "hard_skills: How well the candidate’s skills match the actual job requirements (not just keywords).",
    "0 = no relevant skills for the job",
    "1 = fully capable of performing the job responsibilities based on skills match",
    "Partial credit depends on practical usability of skills in the role",

    "seniority: Alignment between candidate experience and job expectations.",
    "1.0 = clearly ready to perform at required level with autonomy",
    "0.75 = slightly underqualified but likely adaptable quickly",
    "0.5 = moderate gap but potentially viable with support",
    "0.25 = major gap in experience level",
    "0 = completely misaligned level",
    "If no seniority is specified, infer from responsibilities and return best estimate",

    "semantic: Real-world contextual fit between candidate and job.",
    "Consider domain, industry, tools, work type, environment, and responsibilities.",
    "Use cosine_similarity as a weak signal only, not a primary decision factor.",
    "Normalize cosine from [-1,1] to [0,1] as a baseline, then adjust based on job realism and context fit.",

    "bonus: Additional signals that increase hiring attractiveness.",
    "Include: portfolio relevance, concrete achievements, impactful projects, leadership signals, or strong domain expertise.",
    "Cap at 1.0.",

    "## Key evaluation focus (very important)",
    "Assess fit between:",
    "- What the company is actually asking someone to DO (mission, responsibilities)",
    "- What the candidate can realistically DO today",

    "## Explanation rules",

    "Strict rules:",
    "- Base your analysis ONLY on provided data.",
    "- Never invent skills, experience, education, or achievements.",
    "- If information is missing, treat it as unknown.",
    "- Every claim must be directly supported by the input.",

    "Tone:",
    "- Speak directly to the candidate using 'you' and 'your'.",
    "- Do not refer to 'the candidate'.",
    "- Be factual, specific, and grounded in job reality.",

    "Analysis guidelines:",
    "- strengths: 3 to 7 concrete alignment points between you and the job mission/requirements.",
    "- weaknesses: 0 to 5 real gaps preventing you from succeeding in the role.",
    "- missing_skills: ONLY skills explicitly required or clearly implied by the job but not found in your profile.",
    "- missing_skills must be keyword-only (e.g. 'Python', 'AWS', 'Docker').",
    "- recommendations: 2 to 5 actionable steps to increase your chance of getting or succeeding in this job.",
    "- summary: explain your overall fit in terms of job readiness and success probability, not ATS score. Explain also how confident you are in this analysis and why (e.g. based on how complete the job description is, how detailed the candidate profile is, and how much uncertainty remains) but keep this part short.",

    "Additional rules:",
    "- Do not fabricate weaknesses if alignment is strong.",
    "- If no missing skills exist, return an empty array.",
    "- Every recommendation must directly address a real gap or improvement opportunity.",

    "Output requirements:",
    "- Return valid JSON only:",
    '{ "scores": { "hard_skills": 0.0, "seniority": 0.0, "semantic": 0.0, "bonus": 0.0 }, "strengths": [], "weaknesses": [], "missing_skills": [], "recommendations": [], "summary": "" }',
    "- No markdown, no commentary, no extra text.",
  ].join(" ");

  const user = JSON.stringify({
    cosine_similarity: params.semanticSimilarity,
    job: {
      title: params.job.title,
      company: params.job.company,
      seniority: params.job.seniority,
      requirements: params.job.requirements,
      skills: params.job.skills,
      description: params.job.description?.slice(0, 4000),
    },
    candidate: params.profile,
  });

  const result = await chatJSON({
    operation: "matching_explanation",
    userId: params.userId,
    schema: MatchingExplanationSchema,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const { scores, ...explanation } = result;

  const breakdown: ScoreBreakdown = {
    hardSkills: scores.hard_skills,
    seniority: scores.seniority,
    semantic: scores.semantic,
    bonus: scores.bonus,
    final: Math.round(
      (scores.hard_skills * WEIGHTS.hardSkills +
        scores.seniority * WEIGHTS.seniority +
        scores.semantic * WEIGHTS.semantic +
        scores.bonus * WEIGHTS.bonus) *
        100,
    ),
  };

  return { breakdown, ...explanation };
}
