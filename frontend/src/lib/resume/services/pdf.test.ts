import { describe, it, expect } from "vitest";
import { RESUME_TEMPLATES } from "@/types/job";
import { renderResumePdf } from "./pdf";
import type { ResumePdfData } from "../types";

const SAMPLE: ResumePdfData = {
  fullName: "Jane Doe",
  headline: "Senior Financial Analyst",
  contact: { email: "jane@example.com", phone: "+33 6 00 00 00 00", location: "Paris" },
  summary: "Executive summary of the candidate.",
  experiences: [
    {
      organization: "Goldman Sachs",
      role: "Analyst",
      highlights: ["Built valuation models", "Led M&A diligence"],
    },
  ],
  skills: ["Financial Modeling", "Valuation", "Excel"],
  education: [{ organization: "HEC Paris", role: "MSc Finance" }],
};

describe("renderResumePdf", () => {
  it.each(RESUME_TEMPLATES)("renders a non-empty PDF for the %s template", async (template) => {
    const buffer = await renderResumePdf(SAMPLE, template);
    expect(buffer.length).toBeGreaterThan(0);
    // PDF files start with the "%PDF" magic bytes.
    expect(buffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });
});
