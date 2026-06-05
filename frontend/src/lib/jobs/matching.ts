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

/** Cosine similarity between two equal-length vectors, in [-1, 1]. */
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
  /** Weighted final score, 0-100. */
  final: number;
}

/**
 * Asks Mistral to score each match dimension (0-1) and explain the match.
 * The final score is the weighted sum of the LLM-provided dimension scores.
 */
export async function getMatchingExplanation(params: {
  userId: string;
  job: JobData;
  profile: CandidateProfile;
  semanticSimilarity: number;
}): Promise<{ breakdown: ScoreBreakdown } & Omit<MatchingExplanation, "scores">> {
  const system = [
    "You are an expert career-matching and recruitment analysis assistant.",

    "You receive:",
    "- A candidate profile",
    "- A job posting",
    "- A cosine similarity score between the candidate's and job's text embeddings (range -1 to 1)",

    "Your task is to score the match across four dimensions AND explain it.",

    "## Scoring rules (all scores are floats in [0, 1])",

    "hard_skills: Fraction of required/preferred skills listed in the job that appear in the candidate profile.",
    "Be precise: 0 = no skills match, 1 = every required skill is present.",
    "Partial credit is proportional to the number of matches.",

    "seniority: Alignment between the candidate's experience level and the job's seniority requirement.",
    "1.0 = candidate meets or exceeds the level. Deduct 0.25 per level gap below the requirement.",
    "If no seniority requirement is stated, return 0.5.",

    "semantic: Overall contextual fit (domain, industry, type of work).",
    "Use the provided cosine_similarity as objective anchor, then adjust based on your reading.",
    "Map cosine from [-1,1] to [0,1] as a starting point before applying judgment.",

    "bonus: Extra profile strength signals.",
    "Award up to 0.4 for side projects/portfolio, up to 0.3 for a detailed bio (>80 chars), up to 0.3 for relevant education.",
    "Cap at 1.0.",

    "## Explanation rules",

    "Strict rules:",
    "- Base your analysis ONLY on the provided data.",
    "- Never invent skills, experience, education, certifications, achievements, responsibilities, or qualifications.",
    "- If information is missing, treat it as missing rather than assuming it exists.",
    "- Ensure every strength, weakness, recommendation, and conclusion is supported by the provided data.",

    "Perspective and tone:",
    "- Write all narrative fields as personalized feedback addressed directly to the candidate.",
    "- Use second-person language ('you', 'your').",
    "- Do not refer to the candidate as 'the candidate', 'they', or 'this person'.",
    "- Keep the tone professional, factual, and encouraging.",

    "Analysis guidelines:",
    "- strengths: 3 to 7 concise statements describing clear alignments between the candidate profile and the job requirements.",
    "- weaknesses: 0 to 5 concise statements describing genuine gaps or unmet requirements.",
    "- missing_skills: required or strongly preferred skills from the job not found in the candidate profile.",
    "- missing_skills MUST contain skill keywords only (e.g. 'Python', 'AWS', 'Docker', 'React').",
    "- recommendations: 2 to 5 concrete, actionable suggestions to improve suitability.",
    "- summary: a concise overall assessment explaining why the match score is high, medium, or low.",

    "Additional rules:",
    "- If the candidate is a strong match, do not fabricate weaknesses.",
    "- If no missing skills are identified, return an empty array.",
    "- Every recommendation must be specific and linked to an identified gap.",

    "Output requirements:",
    "- Respond with valid JSON only, strictly matching this structure:",
    '{ "scores": { "hard_skills": 0.0, "seniority": 0.0, "semantic": 0.0, "bonus": 0.0 }, "strengths": [], "weaknesses": [], "missing_skills": [], "recommendations": [], "summary": "" }',
    "- Replace the 0.0 placeholders with your actual scores.",
    "- Do not include markdown, code fences, explanations, comments, or additional text.",
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
