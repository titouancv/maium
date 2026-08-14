import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ANON_ANALYSIS_STORAGE_KEY,
  ANON_PENDING_JOB_STORAGE_KEY,
} from "@/constants";
import {
  clearStoredAnalysisId,
  hasPendingJob,
  readPendingJob,
  readStoredAnalysisId,
  writePendingJob,
  writeStoredAnalysisId,
} from "./anonStorage";

const store = new Map<string, string>();

vi.stubGlobal("localStorage", {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, value),
  removeItem: (key: string) => store.delete(key),
});

describe("anonStorage", () => {
  beforeEach(() => {
    store.clear();
  });

  it("round-trips the analysis id", () => {
    writeStoredAnalysisId("abc-123");
    expect(readStoredAnalysisId()).toBe("abc-123");
    clearStoredAnalysisId();
    expect(readStoredAnalysisId()).toBeNull();
  });

  it("treats a blank analysis id as absent", () => {
    store.set(ANON_ANALYSIS_STORAGE_KEY, "   ");
    expect(readStoredAnalysisId()).toBeNull();
  });

  it("round-trips a pending url offer", () => {
    writePendingJob({ mode: "url", jobUrl: "https://example.com/job" });
    expect(hasPendingJob()).toBe(true);
    expect(readPendingJob()).toEqual({
      mode: "url",
      jobUrl: "https://example.com/job",
    });
  });

  it("drops an unparsable pending offer instead of throwing", () => {
    store.set(ANON_PENDING_JOB_STORAGE_KEY, "{not json");
    expect(readPendingJob()).toBeNull();
    expect(hasPendingJob()).toBe(false);
  });

  it("drops a pending offer that no longer matches the schema", () => {
    store.set(
      ANON_PENDING_JOB_STORAGE_KEY,
      JSON.stringify({ mode: "url", jobUrl: "not-a-url" }),
    );
    expect(readPendingJob()).toBeNull();
    expect(hasPendingJob()).toBe(false);
  });

  it("survives a storage that throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    });

    expect(readStoredAnalysisId()).toBeNull();
    expect(readPendingJob()).toBeNull();
    expect(() => writeStoredAnalysisId("abc")).not.toThrow();
  });
});
