import {
  ANON_ANALYSIS_STORAGE_KEY,
  ANON_PENDING_JOB_STORAGE_KEY,
  ANON_USED_STORAGE_KEY,
} from "@/constants";
import { AnalyzeJobSchema, type AnalyzeJobInput } from "@/lib/validators/job";

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function removeRaw(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function isFreeRunSpent(): boolean {
  return readRaw(ANON_USED_STORAGE_KEY) === "1";
}

export function markFreeRunSpent(): void {
  writeRaw(ANON_USED_STORAGE_KEY, "1");
}

export function readStoredAnalysisId(): string | null {
  const value = readRaw(ANON_ANALYSIS_STORAGE_KEY);
  return value && value.trim() ? value : null;
}

export function writeStoredAnalysisId(analysisId: string): void {
  writeRaw(ANON_ANALYSIS_STORAGE_KEY, analysisId);
}

export function clearStoredAnalysisId(): void {
  removeRaw(ANON_ANALYSIS_STORAGE_KEY);
}

export function readPendingJob(): AnalyzeJobInput | null {
  const raw = readRaw(ANON_PENDING_JOB_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = AnalyzeJobSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
  } catch {}

  clearPendingJob();
  return null;
}

export function hasPendingJob(): boolean {
  return readRaw(ANON_PENDING_JOB_STORAGE_KEY) !== null;
}

export function writePendingJob(input: AnalyzeJobInput): void {
  writeRaw(ANON_PENDING_JOB_STORAGE_KEY, JSON.stringify(input));
}

export function clearPendingJob(): void {
  removeRaw(ANON_PENDING_JOB_STORAGE_KEY);
}
