export const ANALYSIS_STATUSES = [
  "queued",
  "processing",
  "completed",
  "failed",
] as const;
export type AnalysisStatus = (typeof ANALYSIS_STATUSES)[number];

export const RESUME_TEMPLATES = ["finance", "modern"] as const;
export type ResumeTemplate = (typeof RESUME_TEMPLATES)[number];

export const ANALYSIS_STEPS = [
  "EXTRACTING_JOB",
  "MATCHING_PROFILE",
  "OPTIMIZING_RESUME",
  "GENERATING_EMBEDDINGS",
] as const;
export type AnalysisStep = (typeof ANALYSIS_STEPS)[number];

export interface JobData {
  id: string;
  source_url: string;
  title: string | null;
  company: string | null;
  location: string | null;
  employment_type: string | null;
  salary: string | null;
  description: string | null;
  requirements: string[];
  skills: string[];
  seniority: string | null;
}

export interface AnalysisJob {
  id: string;
  user_id: string;
  job_id: string | null;
  source_url: string | null;
  status: AnalysisStatus;
  current_step: AnalysisStep | null;
  progress: number;
  analysis_id: string | null;
  error_message: string | null;
  created_at: string;
}

export interface AnalysisData {
  id: string;
  job_id: string;
  matching_score: number;
  confidence_score: number;
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  recommendations: string[];
  summary: string | null;
  cover_letter: string | null;
  created_at: string;
}

export interface AnalysisListItem extends AnalysisData {
  job: Pick<JobData, "title" | "company" | "location" | "source_url"> | null;
  resume_id: string | null;
}

export interface OptimizedResume {
  id: string;
  job_id: string;
  analysis_id: string | null;
  version: number;
  resume_json: ResumeJson;
  ats_score: number | null;
  is_active: boolean;
  created_at: string;
}

export interface ResumeVersion {
  id: string;
  version_number: number;
  resume_json: ResumeJson;
  diff_summary: string | null;
  created_at: string;
}

export interface ResumeJson {
  summary: string;
  experiences: Array<{
    organization: string;
    role: string;
    startPeriod: number;
    endPeriod?: number;
    location?: string;
    description: string;
  }>;
  education: Array<{
    organization: string;
    role: string;
    startPeriod: number;
    endPeriod?: number;
    location?: string;
    description: string;
  }>;
  skills: string[];
}

export interface CandidateProfile {
  bio: string;
  experiences: Array<{
    organization: string;
    role: string;
    startPeriod: number;
    endPeriod?: number;
    location?: string;
    description: string;
  }>;
  education: Array<{
    organization: string;
    role: string;
    startPeriod: number;
    endPeriod?: number;
    location?: string;
    description: string;
  }>;
  skills: string[];
  projects: string[];
}
