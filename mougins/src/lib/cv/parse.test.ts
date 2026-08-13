import { describe, it, expect } from "vitest";
import { normalizeCvExtraction } from "./parse";
import {
  CV_LIMITS,
  CvExtractionRawSchema,
  CvExtractionSchema,
} from "@/lib/validators/cv";

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
    expect(CvExtractionSchema.safeParse(result).success).toBe(true);
  });

  it("truncates over-long values to what the profile schema allows", () => {
    const result = normalizeCvExtraction(
      raw({
        firstName: "a".repeat(80),
        skills: ["s".repeat(80)],
        bio: "b".repeat(5000),
        professionalExperiences: [
          experience({
            organization: "o".repeat(200),
            location: "l".repeat(200),
            description: "d".repeat(5000),
          }),
        ],
        hobbies: [{ title: "t".repeat(200), description: "h".repeat(2000) }],
      }),
    );
    expect(result.firstName).toHaveLength(50);
    expect(result.skills![0]).toHaveLength(50);
    expect(result.bio).toHaveLength(4000);
    expect(result.professionalExperiences![0].organization).toHaveLength(120);
    expect(result.professionalExperiences![0].location).toHaveLength(100);
    expect(result.professionalExperiences![0].description).toHaveLength(4000);
    expect(result.hobbies![0].title).toHaveLength(100);
    expect(result.hobbies![0].description).toHaveLength(1000);
    expect(CvExtractionSchema.safeParse(result).success).toBe(true);
  });

  it("accepts null for every field the model may omit", () => {
    const parsed = CvExtractionRawSchema.safeParse({
      firstName: null,
      lastName: null,
      phone: null,
      nationality: null,
      location: null,
      bio: null,
      professionalExperiences: null,
      educationalExperiences: null,
      personalExperiences: null,
      skills: null,
      projects: null,
      socialNetworks: null,
      hobbies: null,
    });
    expect(parsed.success).toBe(true);
    expect(normalizeCvExtraction(parsed.data!)).toEqual({
      firstName: undefined,
      lastName: undefined,
      phone: undefined,
      nationality: undefined,
      location: undefined,
      bio: undefined,
      professionalExperiences: undefined,
      educationalExperiences: undefined,
      personalExperiences: undefined,
      skills: undefined,
      projects: undefined,
      socialNetworks: undefined,
      hobbies: undefined,
    });
  });

  it("accepts a wholly empty object and null fields inside entries", () => {
    expect(CvExtractionRawSchema.safeParse({}).success).toBe(true);

    const parsed = CvExtractionRawSchema.parse({
      professionalExperiences: [
        { organization: "Acme", role: null, startPeriod: "2020-01" },
        { organization: null, role: "Dev", startPeriod: "2020-01" },
        { organization: "Kept", role: "Dev", startPeriod: "2020-01" },
      ],
    });
    const result = normalizeCvExtraction(parsed);
    expect(result.professionalExperiences).toHaveLength(1);
    expect(result.professionalExperiences![0].organization).toBe("Kept");
  });
});
