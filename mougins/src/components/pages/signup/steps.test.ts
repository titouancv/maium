import { describe, it, expect } from "vitest";
import {
  SIGNUP_STEPS,
  SIGNUP_TOTAL_STEPS,
  getResumeStep,
  hasCompletedOnboarding,
  stepIndexOf,
  type SignupDraft,
} from "./steps";
import type { UserData } from "@/types";

const full: SignupDraft = {
  firstName: "Ada",
  lastName: "Lovelace",
  pseudo: "ada",
  dob: Date.UTC(1990, 0, 1),
  gender: "female",
};

const user = (overrides: Partial<UserData> = {}): UserData => ({
  email: "ada@example.com",
  first_name: "Ada",
  last_name: "Lovelace",
  pseudo: "ada",
  dob: Date.UTC(1990, 0, 1),
  gender: "female",
  ...overrides,
});

describe("SIGNUP_STEPS", () => {
  it("puts the CV import first and the photo last", () => {
    expect(SIGNUP_STEPS[0].key).toBe("cv");
    expect(SIGNUP_STEPS[SIGNUP_STEPS.length - 1].key).toBe("photo");
  });

  it("marks exactly the two skippable steps optional", () => {
    const optional = SIGNUP_STEPS.filter((s) => s.optional).map((s) => s.key);
    expect(optional).toEqual(["cv", "photo"]);
  });

  it("exposes 1-based indexes matching the list order", () => {
    expect(stepIndexOf("cv")).toBe(1);
    expect(stepIndexOf("photo")).toBe(SIGNUP_TOTAL_STEPS);
  });
});

describe("getResumeStep", () => {
  it("starts a first-run user on the CV import", () => {
    expect(getResumeStep({})).toBe(stepIndexOf("cv"));
  });

  it("still starts on the CV import when OAuth already supplied the name", () => {
    expect(getResumeStep({ firstName: "Ada", lastName: "Lovelace" })).toBe(
      stepIndexOf("cv"),
    );
  });

  it("resumes at the first missing required field once past the pseudo", () => {
    expect(getResumeStep({ ...full, dob: undefined })).toBe(stepIndexOf("date"));
    expect(getResumeStep({ ...full, gender: undefined })).toBe(
      stepIndexOf("gender"),
    );
  });

  it("never sends a returning user back to the CV import", () => {
    for (const draft of [
      { ...full, dob: undefined },
      { ...full, gender: undefined },
      full,
    ]) {
      expect(getResumeStep(draft)).not.toBe(stepIndexOf("cv"));
    }
  });

  it("lands on the last step once every required field is filled", () => {
    expect(getResumeStep(full)).toBe(SIGNUP_TOTAL_STEPS);
    expect(stepIndexOf("photo")).toBe(SIGNUP_TOTAL_STEPS);
  });

  it("ignores CV-only fields when choosing where to resume", () => {
    expect(
      getResumeStep({ ...full, skills: ["TypeScript"], bio: "Engineer" }),
    ).toBe(SIGNUP_TOTAL_STEPS);
  });
});

describe("hasCompletedOnboarding", () => {
  it("is true once the required fields are filled, with no photo or CV", () => {
    expect(hasCompletedOnboarding(user())).toBe(true);
  });

  it("stays false while a required field is missing", () => {
    expect(hasCompletedOnboarding(user({ pseudo: "" }))).toBe(false);
    expect(hasCompletedOnboarding(user({ dob: null }))).toBe(false);
    expect(hasCompletedOnboarding(user({ gender: null }))).toBe(false);
    expect(hasCompletedOnboarding(user({ first_name: "" }))).toBe(false);
  });

  it("does not require the optional steps", () => {
    expect(hasCompletedOnboarding(user({ profile_photo: null }))).toBe(true);
  });
});
