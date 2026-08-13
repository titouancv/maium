import { describe, it, expect } from "vitest";
import { MatchingExplanationSchema } from "./job";

const SCORES = {
  hard_skills: 0.8,
  seniority: 0.6,
  semantic: 0.5,
  bonus: 0.2,
};

function parse(overrides: Record<string, unknown>) {
  return MatchingExplanationSchema.parse({
    scores: SCORES,
    prep_points: [],
    recruiter_questions: [],
    summary: "",
    ...overrides,
  });
}

describe("MatchingExplanationSchema", () => {
  it("unwraps recruiter questions the model returned as objects", () => {
    const result = parse({
      recruiter_questions: [
        { question: "How is the team structured?" },
        "What does the roadmap look like?",
      ],
    });
    expect(result.recruiter_questions).toEqual([
      "How is the team structured?",
      "What does the roadmap look like?",
    ]);
  });

  it("drops recruiter questions it cannot read rather than failing", () => {
    const result = parse({ recruiter_questions: ["  ", 42, null, "Real one"] });
    expect(result.recruiter_questions).toEqual(["Real one"]);
  });

  it("falls back on an unknown prep point kind instead of throwing", () => {
    const result = parse({
      prep_points: [
        {
          title: "Practice behavioural answers",
          detail: "They will probe past conflict.",
          kind: "behavioral",
          resource_query: "star method interview",
          resource_kind: "podcast",
        },
      ],
    });
    expect(result.prep_points[0].kind).toBe("technical");
    expect(result.prep_points[0].resource_kind).toBe("video");
  });

  it("accepts enum values the model capitalised", () => {
    const result = parse({
      prep_points: [
        {
          title: "Read their engineering blog",
          detail: "Know the product.",
          kind: " Company ",
          resource_query: "engineering culture",
          resource_kind: "Article",
        },
      ],
    });
    expect(result.prep_points[0].kind).toBe("company");
    expect(result.prep_points[0].resource_kind).toBe("article");
  });

  it("promotes a bare string prep point into a full object", () => {
    const result = parse({ prep_points: ["Revise SQL window functions"] });
    expect(result.prep_points[0]).toMatchObject({
      title: "Revise SQL window functions",
      kind: "technical",
      resource_kind: "video",
    });
  });

  it("never throws when the model sends the wrong container type", () => {
    const result = parse({
      prep_points: "not an array",
      recruiter_questions: { a: "b" },
    });
    expect(result.prep_points).toEqual([]);
    expect(result.recruiter_questions).toEqual([]);
  });
});
