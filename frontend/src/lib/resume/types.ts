import type { ResumeJson } from "@/types/job";

/** Everything a resume template needs to render a complete CV. */
export interface ResumePdfData {
  fullName: string;
  headline: string;
  contact: {
    email: string | null;
    phone: string | null;
    location: string | null;
  };
  summary: string;
  experiences: ResumeJson["experiences"];
  skills: string[];
  /** Pulled from the candidate profile (not part of the optimized resume_json). */
  education: Array<{ organization: string; role: string }>;
}
