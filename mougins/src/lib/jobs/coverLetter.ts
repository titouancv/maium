import { chatJSON } from "@/lib/mistral";
import { CoverLetterSchema } from "@/lib/validators/job";
import type { CandidateProfile, JobData } from "@/types/job";

export async function generateCoverLetter(params: {
  userId: string | null;
  job: JobData;
  profile: CandidateProfile;
}): Promise<string> {
  const system = [
    "You are an expert career writer drafting a concise, compelling cover letter for the given job.",
    "Write the cover letter in the same language as the job posting (title, requirements, skills).",
    "ABSOLUTE RULES: only use facts present in the candidate data — never invent, add or exaggerate experience, skills, employers or achievements.",
    "Connect the candidate's real background to the role's requirements, and keep it to 3–4 short paragraphs.",
    "Do NOT include placeholders, the date, postal addresses, or bracketed tokens like [Company] — write ready-to-send prose using only what is provided.",
    "Return a JSON object with a single key: cover_letter (the full letter as a single string, paragraphs separated by blank lines).",
  ].join(" ");

  const user = JSON.stringify({
    job: {
      title: params.job.title,
      company: params.job.company,
      skills: params.job.skills,
      requirements: params.job.requirements,
      seniority: params.job.seniority,
    },
    candidate: {
      bio: params.profile.bio,
      experiences: params.profile.experiences.map((e) => ({
        organization: e.organization,
        role: e.role,
        description: e.description,
      })),
      education: params.profile.education.map((e) => ({
        organization: e.organization,
        role: e.role,
        description: e.description,
      })),
      skills: params.profile.skills,
    },
  });

  const output = await chatJSON({
    operation: "cover_letter_generation",
    userId: params.userId,
    schema: CoverLetterSchema,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  return output.cover_letter;
}
