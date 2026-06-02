import { describe, it, expect } from "vitest";
import {
  cosineSimilarity,
  hardSkillsScore,
  computeFinalScore,
} from "./matching";
import type { CandidateProfile } from "@/types/job";

const profile: CandidateProfile = {
  bio: "Experienced full-stack engineer with a strong product focus, shipping reliable web apps for many years across several teams.",
  experiences: [
    { organization: "A", role: "Engineer", description: "" },
    { organization: "B", role: "Engineer", description: "" },
  ],
  education: [{ organization: "Uni", role: "BSc" }],
  skills: ["TypeScript", "React", "Node"],
  projects: ["https://example.com"],
};

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });
  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });
  it("returns 0 for mismatched lengths", () => {
    expect(cosineSimilarity([1, 0], [0, 1, 2])).toBe(0);
  });
});

describe("hardSkillsScore", () => {
  it("is the case-insensitive fraction of job skills owned", () => {
    expect(hardSkillsScore(["typescript", "go"], profile.skills)).toBe(0.5);
  });
  it("is 0 when the job lists no skills", () => {
    expect(hardSkillsScore([], profile.skills)).toBe(0);
  });
});

describe("computeFinalScore", () => {
  it("returns 0-100 and weights the four signals", () => {
    const breakdown = computeFinalScore({
      jobSkills: ["TypeScript", "React"],
      profile,
      jobSeniority: "mid",
      semanticSimilarity: 1,
    });
    expect(breakdown.final).toBeGreaterThan(0);
    expect(breakdown.final).toBeLessThanOrEqual(100);
    expect(breakdown.hardSkills).toBe(1);
    expect(breakdown.semantic).toBe(1);
  });

  it("a perfect match across all signals scores 100", () => {
    const breakdown = computeFinalScore({
      jobSkills: ["TypeScript"],
      profile,
      jobSeniority: "junior",
      semanticSimilarity: 1,
    });
    expect(breakdown.final).toBe(100);
  });
});
