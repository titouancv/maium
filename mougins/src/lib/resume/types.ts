import type { ResumeJson } from "@/types/job";
import type { Hobby } from "@/types/user";

export interface ResumePdfData {
  fullName: string;
  contact: {
    email: string | null;
    phone: string | null;
    location: string | null;
  };
  summary: string;
  socialNetworks: Array<{ name: string; handle: string; url: string }>;
  hobbies: Hobby[];
  pseudo: string;
  profileUrl: string;
  profileQrCode: string;
  experiences: ResumeJson["experiences"];
  skills: string[];
  education: Array<{
    organization: string;
    role: string;
    startPeriod: number;
    endPeriod?: number;
    location?: string;
    description?: string;
  }>;
}
