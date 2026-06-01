import { chatJSON } from "@/lib/mistral";
import { MatchingExplanationSchema, type MatchingExplanation } from "@/lib/validators/job";
import type { CandidateProfile, JobData } from "@/types/job";

// Hybrid match weights. The LLM never decides the score — it only explains it.
const WEIGHTS = {
  hardSkills: 0.4,
  seniority: 0.25,
  semantic: 0.2,
  bonus: 0.15,
} as const;

const SENIORITY_RANK: Record<string, number> = {
  intern: 0,
  junior: 1,
  "entry-level": 1,
  mid: 2,
  intermediate: 2,
  senior: 3,
  lead: 4,
  principal: 4,
  staff: 4,
  director: 5,
};

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

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

/** Fraction of the job's required skills present in the candidate profile (0-1). */
export function hardSkillsScore(jobSkills: string[], profileSkills: string[]): number {
  if (jobSkills.length === 0) return 0;
  const owned = new Set(profileSkills.map(normalize));
  const matched = jobSkills.filter((s) => owned.has(normalize(s))).length;
  return matched / jobSkills.length;
}

/** Seniority alignment (0-1): 1 when the candidate meets or exceeds the job's level. */
export function seniorityScore(
  jobSeniority: string | null,
  profile: CandidateProfile,
): number {
  const target = jobSeniority ? SENIORITY_RANK[normalize(jobSeniority)] : undefined;
  if (target === undefined) return 0.5; // unknown requirement → neutral
  const years = profile.experiences.length;
  const candidateRank = years >= 8 ? 4 : years >= 5 ? 3 : years >= 2 ? 2 : years >= 1 ? 1 : 0;
  if (candidateRank >= target) return 1;
  return Math.max(0, 1 - (target - candidateRank) * 0.25);
}

/** Bonus signals (0-1) from extra profile material. */
export function bonusScore(profile: CandidateProfile): number {
  let score = 0;
  if (profile.projects.length > 0) score += 0.4;
  if (profile.bio.length > 80) score += 0.3;
  if (profile.education.length > 0) score += 0.3;
  return Math.min(1, score);
}

export interface ScoreBreakdown {
  hardSkills: number;
  seniority: number;
  semantic: number;
  bonus: number;
  /** Weighted final score, 0-100. */
  final: number;
}

/** Combines the four signals into the weighted final score (0-100). */
export function computeFinalScore(params: {
  jobSkills: string[];
  profile: CandidateProfile;
  jobSeniority: string | null;
  semanticSimilarity: number;
}): ScoreBreakdown {
  const hardSkills = hardSkillsScore(params.jobSkills, params.profile.skills);
  const seniority = seniorityScore(params.jobSeniority, params.profile);
  // Map cosine [-1,1] to [0,1].
  const semantic = Math.max(0, (params.semanticSimilarity + 1) / 2);
  const bonus = bonusScore(params.profile);

  const final =
    (hardSkills * WEIGHTS.hardSkills +
      seniority * WEIGHTS.seniority +
      semantic * WEIGHTS.semantic +
      bonus * WEIGHTS.bonus) *
    100;

  return {
    hardSkills,
    seniority,
    semantic,
    bonus,
    final: Math.round(final),
  };
}

/**
 * Asks Mistral for the human-readable explanation of the match. The numeric
 * score is computed deterministically; the model only narrates strengths,
 * weaknesses, missing skills and recommendations.
 */
export async function getMatchingExplanation(params: {
  userId: string;
  job: JobData;
  profile: CandidateProfile;
  breakdown: ScoreBreakdown;
}): Promise<MatchingExplanation> {
  const system = [
    "You are a career-matching assistant.",
    "You are given a candidate profile and a job posting, plus a precomputed match score.",
    "Explain the match: strengths, weaknesses, missing_skills, recommendations, and a short summary.",
    "Base your analysis ONLY on the data provided. Do not invent experience or skills the candidate does not have.",
    "Respond as a JSON object with keys: strengths, weaknesses, missing_skills, recommendations (string arrays) and summary (string).",
  ].join(" ");

  const user = JSON.stringify({
    precomputed_score: params.breakdown,
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

  return chatJSON({
    operation: "matching_explanation",
    userId: params.userId,
    schema: MatchingExplanationSchema,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
}
