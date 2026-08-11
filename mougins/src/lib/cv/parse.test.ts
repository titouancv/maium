import { describe, it, expect } from "vitest";
import { normalizeCvExtraction } from "./parse";
import {
  CV_LIMITS,
  CvExtractionRawSchema,
  CvExtractionSchema,
} from "@/lib/validators/cv";

/** A raw model response with everything empty, to be overridden per test. */
const raw = (overrides: Record<string, unknown> = {}) =>
  CvExtractionRawSchema.parse(overrides);

const experience = (overrides: Record<string, unknown> = {}) => ({
  organization: "Acme",
  role: "Engineer",
  description: "",
  location: "",
  startPeriod: "2020-01",
  endPeriod: "",
  ...overrides,
});

describe("normalizeCvExtraction", () => {
  it("omits every key when the CV yielded nothing", () => {
    const result = normalizeCvExtraction(raw());
    expect(Object.values(result).every((v) => v === undefined)).toBe(true);
  });

  it("trims text fields and drops whitespace-only ones", () => {
    const result = normalizeCvExtraction(
      raw({ firstName: "  Ada  ", lastName: "   ", bio: " Builds things. " }),
    );
    expect(result.firstName).toBe("Ada");
    expect(result.lastName).toBeUndefined();
    expect(result.bio).toBe("Builds things.");
  });

  it("converts periods to epoch ms", () => {
    const result = normalizeCvExtraction(
      raw({
        professionalExperiences: [
          experience({ startPeriod: "2020-03", endPeriod: "2022-09" }),
        ],
      }),
    );
    expect(result.professionalExperiences).toEqual([
      {
        organization: "Acme",
        role: "Engineer",
        description: undefined,
        location: undefined,
        startPeriod: Date.UTC(2020, 2, 1),
        endPeriod: Date.UTC(2022, 8, 1),
      },
    ]);
  });

  it("treats an unparseable end date as ongoing", () => {
    const [entry] = normalizeCvExtraction(
      raw({
        professionalExperiences: [experience({ endPeriod: "Present" })],
      }),
    ).professionalExperiences!;
    expect(entry.endPeriod).toBeUndefined();
  });

  it("treats an end date before the start as ongoing", () => {
    const [entry] = normalizeCvExtraction(
      raw({
        professionalExperiences: [
          experience({ startPeriod: "2022-01", endPeriod: "2020-01" }),
        ],
      }),
    ).professionalExperiences!;
    expect(entry.endPeriod).toBeUndefined();
  });

  it("drops experiences missing an organization, a role or a start date", () => {
    const result = normalizeCvExtraction(
      raw({
        professionalExperiences: [
          experience({ organization: "  " }),
          experience({ role: "" }),
          experience({ startPeriod: "" }),
          experience({ organization: "Kept" }),
        ],
      }),
    );
    expect(result.professionalExperiences).toHaveLength(1);
    expect(result.professionalExperiences![0].organization).toBe("Kept");
  });

  it("omits an experience array that ends up empty", () => {
    const result = normalizeCvExtraction(
      raw({ educationalExperiences: [experience({ startPeriod: "" })] }),
    );
    expect(result.educationalExperiences).toBeUndefined();
  });

  it("keeps only absolute http(s) URLs", () => {
    const result = normalizeCvExtraction(
      raw({
        projects: ["https://example.com/a", "example.com/b", "", "ftp://x/y"],
        socialNetworks: ["http://linkedin.com/in/ada", "@ada"],
      }),
    );
    expect(result.projects).toEqual(["https://example.com/a"]);
    expect(result.socialNetworks).toEqual(["http://linkedin.com/in/ada"]);
  });

  it("drops blank skills and keeps the rest", () => {
    const result = normalizeCvExtraction(
      raw({ skills: [" TypeScript ", "  ", "Postgres"] }),
    );
    expect(result.skills).toEqual(["TypeScript", "Postgres"]);
  });

  it("drops hobbies without a title", () => {
    const result = normalizeCvExtraction(
      raw({
        hobbies: [
          { title: " ", description: "x" },
          { title: "Climbing", description: " outdoors " },
        ],
      }),
    );
    expect(result.hobbies).toEqual([
      { title: "Climbing", description: "outdoors" },
    ]);
  });

  // The anonymous /analyze flow posts an extraction back to the server, where
  // it is re-validated with CvExtractionSchema. Normalized output must pass.
  it("produces output that CvExtractionSchema accepts", () => {
    const result = normalizeCvExtraction(
      raw({
        firstName: "Ada",
        lastName: "Lovelace",
        phone: "+33 6 00 00 00 00",
        location: "Paris",
        bio: "Builds things.",
        professionalExperiences: [experience({ description: "Shipped stuff." })],
        educationalExperiences: [experience({ organization: "Cambridge" })],
        skills: ["TypeScript"],
        projects: ["https://example.com/a"],
        socialNetworks: ["https://linkedin.com/in/ada"],
        hobbies: [{ title: "Climbing", description: "outdoors" }],
      }),
    );
    expect(CvExtractionSchema.safeParse(result).success).toBe(true);
  });

  // Deterministic half of the prompt-injection defence: a CV that talks the
  // model into emitting hundreds of entries must not get them through.
  it("caps runaway arrays at CV_LIMITS", () => {
    const result = normalizeCvExtraction(
      raw({
        skills: Array.from({ length: 400 }, (_, i) => `skill-${i}`),
        projects: Array.from(
          { length: 200 },
          (_, i) => `https://example.com/${i}`,
        ),
        socialNetworks: Array.from(
          { length: 200 },
          (_, i) => `https://example.com/s/${i}`,
        ),
        hobbies: Array.from({ length: 100 }, (_, i) => ({
          title: `hobby-${i}`,
          description: "",
        })),
        professionalExperiences: Array.from({ length: 100 }, () => experience()),
      }),
    );

    expect(result.skills).toHaveLength(CV_LIMITS.skills);
    expect(result.projects).toHaveLength(CV_LIMITS.urls);
    expect(result.socialNetworks).toHaveLength(CV_LIMITS.urls);
    expect(result.hobbies).toHaveLength(CV_LIMITS.hobbies);
    expect(result.professionalExperiences).toHaveLength(CV_LIMITS.experiences);
    // The caps must keep the result inside what the schema accepts, since the
    // anonymous /analyze flow re-validates it server-side.
    expect(CvExtractionSchema.safeParse(result).success).toBe(true);
  });

  it("truncates over-long values to what the profile schema allows", () => {
    const result = normalizeCvExtraction(
      raw({
        firstName: "a".repeat(80),
        skills: ["s".repeat(80)],
        professionalExperiences: [
          experience({ organization: "o".repeat(200), location: "l".repeat(200) }),
        ],
      }),
    );
    expect(result.firstName).toHaveLength(50);
    expect(result.skills![0]).toHaveLength(50);
    expect(result.professionalExperiences![0].organization).toHaveLength(120);
    expect(result.professionalExperiences![0].location).toHaveLength(100);
    expect(CvExtractionSchema.safeParse(result).success).toBe(true);
  });
});
