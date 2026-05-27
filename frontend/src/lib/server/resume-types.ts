// Backend response types — update to match the actual backend contract.

export type AnalysisStatus = "pending" | "processing" | "completed" | "failed";

export type AnalyzeResumeResponse = {
  trackingId: string;
  status: AnalysisStatus;
};

export type ResumeStatusResponse = {
  trackingId: string;
  status: AnalysisStatus;
  result?: ResumeAnalysisResult;
  error?: string;
};

export type ResumeAnalysisResult = {
  score: number;
  suggestions: string[];
  keywords: string[];
};

export type ResumeResponse = {
  id: string;
  userId: string;
  jobUrl: string;
  status: AnalysisStatus;
  createdAt: string;
  result?: ResumeAnalysisResult;
};

export type ResumeHistoryResponse = {
  resumes: ResumeResponse[];
  total: number;
};

export type DeleteResumeResponse = {
  success: true;
};
