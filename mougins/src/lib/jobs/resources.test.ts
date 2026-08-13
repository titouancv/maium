import { describe, it, expect } from "vitest";
import type { PrepPoint } from "@/types/job";
import { prepResourceUrl } from "./resources";

function makePoint(overrides: Partial<PrepPoint> = {}): PrepPoint {
  return {
    title: "Revise Kubernetes operators",
    detail: "The job runs its own control plane.",
    kind: "technical",
    resource_query: "kubernetes operators tutorial",
    resource_kind: "video",
    ...overrides,
  };
}

describe("prepResourceUrl", () => {
  it("sends a video point to a YouTube search", () => {
    expect(prepResourceUrl(makePoint())).toBe(
      "https://www.youtube.com/results?search_query=kubernetes+operators+tutorial",
    );
  });

  it("sends an article point to a Google search", () => {
    const url = prepResourceUrl(
      makePoint({ resource_kind: "article", resource_query: "star method" }),
    );
    expect(url).toBe("https://www.google.com/search?q=star+method");
  });

  it("encodes characters that would break the query string", () => {
    const url = prepResourceUrl(makePoint({ resource_query: "c++ & rust" }));
    expect(url).toBe(
      "https://www.youtube.com/results?search_query=c%2B%2B+%26+rust",
    );
  });

  it("returns null when the model gave no query", () => {
    expect(prepResourceUrl(makePoint({ resource_query: "   " }))).toBeNull();
  });
});
