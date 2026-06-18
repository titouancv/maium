import { describe, it, expect } from "vitest";
import { getProfileCompletion } from "./completion";
import type { UserData } from "@/types";

const baseUser: UserData = {
  email: "a@b.com",
  first_name: "Ada",
  last_name: "Lovelace",
  pseudo: "ada",
  dob: null,
};

describe("getProfileCompletion", () => {
  it("reports 0% for a bare profile", () => {
    expect(getProfileCompletion(baseUser)).toEqual({
      percent: 0,
      isComplete: false,
    });
  });

  it("reports 100% and complete when every tracked field is filled", () => {
    const full: UserData = {
      ...baseUser,
      bio: "Pioneer of computing",
      location: "London",
      professional_experiences: [{} as never],
      educational_experiences: [{} as never],
      skills: ["math"],
      hobbies: [{ title: "h", description: "d" }],
      social_networks: ["https://example.com"],
    };
    expect(getProfileCompletion(full)).toEqual({
      percent: 100,
      isComplete: true,
    });
  });

  it("ignores whitespace-only text fields", () => {
    const result = getProfileCompletion({ ...baseUser, bio: "   " });
    expect(result.percent).toBe(0);
  });

  it("counts a partially filled profile proportionally", () => {
    // 2 of 7 tracked fields filled → ~29%.
    const result = getProfileCompletion({
      ...baseUser,
      bio: "hi",
      skills: ["x"],
    });
    expect(result.percent).toBe(29);
    expect(result.isComplete).toBe(false);
  });

  it("treats a profile at or above the 75% threshold as complete", () => {
    // 6 of 7 tracked fields filled → ~86% ≥ 75% → complete.
    const almostFull: UserData = {
      ...baseUser,
      bio: "Pioneer of computing",
      location: "London",
      professional_experiences: [{} as never],
      educational_experiences: [{} as never],
      skills: ["math"],
      hobbies: [{ title: "h", description: "d" }],
    };
    const result = getProfileCompletion(almostFull);
    expect(result.percent).toBe(86);
    expect(result.isComplete).toBe(true);
  });

  it("stays incomplete just below the 75% threshold", () => {
    // 5 of 7 tracked fields filled → ~71% < 75% → not complete.
    const result = getProfileCompletion({
      ...baseUser,
      bio: "Pioneer of computing",
      location: "London",
      professional_experiences: [{} as never],
      educational_experiences: [{} as never],
      skills: ["math"],
    });
    expect(result.percent).toBe(71);
    expect(result.isComplete).toBe(false);
  });
});
