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
  /** Social network links parsed from the candidate profile. */
  socialNetworks: Array<{ name: string; handle: string; url: string }>;
  /** Candidate's maium pseudo (empty when none is set). */
  pseudo: string;
  /** Public maium profile URL of the candidate (empty when no pseudo is set). */
  profileUrl: string;
  /** PNG data-URL QR code pointing to `profileUrl` (empty when no pseudo). */
  profileQrCode: string;
  experiences: ResumeJson["experiences"];
  skills: string[];
  /** Pulled from the candidate profile (not part of the optimized resume_json). */
  education: Array<{
    organization: string;
    role: string;
    startPeriod: number;
    endPeriod?: number;
    location?: string;
    description?: string;
  }>;
}
