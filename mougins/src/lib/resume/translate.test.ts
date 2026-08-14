import { describe, it, expect } from "vitest";
import { mergeResumeTranslation } from "./translate";
import { ResumeTranslationSchema } from "@/lib/validators/job";
import type { ResumeJson } from "@/types/job";

const SOURCE: ResumeJson = {
  summary: "Product engineer.",
  experiences: [
    {
      organization: "Acme",
      role: "Engineer",
      startPeriod: Date.UTC(2020, 0, 1),
      endPeriod: Date.UTC(2022, 0, 1),
      location: "Paris",
      description: "Shipped the billing platform.",
    },
    {
      organization: "Globex",
      role: "Intern",
      startPeriod: Date.UTC(2019, 0, 1),
      location: "Lyon",
      description: "Built internal tools.",
    },
  ],
  education: [
    {
      organization: "HEC",
      role: "MSc",
      startPeriod: Date.UTC(2017, 0, 1),
      endPeriod: Date.UTC(2019, 0, 1),
      description: "Corporate finance.",
    },
  ],
  skills: ["TypeScript", "Product design"],
  hobbies: [{ title: "Trail running", description: "Half marathon." }],
};

const translation = (overrides: Record<string, unknown> = {}) =>
  ResumeTranslationSchema.parse(overrides);

describe("mergeResumeTranslation", () => {
  it("keeps periods, locations and organizations untouched", () => {
    const merged = mergeResumeTranslation(
      SOURCE,
      translation({
        summary: "Ingénieur produit.",
        experiences: [
          { index: 0, role: "Ingénieur", description: "Livré la facturation." },
          { index: 1, role: "Stagiaire", description: "Outils internes." },
        ],
      }),
    );

    expect(merged.experiences[0]).toMatchObject({
      organization: "Acme",
      role: "Ingénieur",
      startPeriod: SOURCE.experiences[0].startPeriod,
      endPeriod: SOURCE.experiences[0].endPeriod,
      location: "Paris",
      description: "Livré la facturation.",
    });
  });

  it("matches entries by index rather than by position", () => {
    const merged = mergeResumeTranslation(
      SOURCE,
      translation({
        experiences: [
          { index: 1, role: "Stagiaire", description: "Outils internes." },
          { index: 0, role: "Ingénieur", description: "Livré la facturation." },
        ],
      }),
    );

    expect(merged.experiences.map((e) => e.role)).toEqual([
      "Ingénieur",
      "Stagiaire",
    ]);
  });

  it("falls back to the source when an entry is missing or empty", () => {
    const merged = mergeResumeTranslation(
      SOURCE,
      translation({
        experiences: [{ index: 0, role: "", description: "" }],
        skills: ["TypeScript"],
      }),
    );

    expect(merged.experiences).toHaveLength(2);
    expect(merged.experiences[0].role).toBe("Engineer");
    expect(merged.experiences[1].description).toBe("Built internal tools.");
    expect(merged.summary).toBe("Product engineer.");
    expect(merged.skills).toEqual(["TypeScript", "Product design"]);
  });

  it("never drops a hobby the model forgot to return", () => {
    const merged = mergeResumeTranslation(SOURCE, translation({}));

    expect(merged.hobbies).toEqual(SOURCE.hobbies);
  });
});
