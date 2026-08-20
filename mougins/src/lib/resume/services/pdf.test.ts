import { describe, it, expect } from "vitest";
import { RESUME_TEMPLATES } from "@/types/job";
import { renderResumePdf } from "./pdf";
import type { ResumePdfData } from "../types";
import type { ResumeLabels } from "../labels";

const LABELS: ResumeLabels = {
  profile: "Profile",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  contact: "Contact",
  social: "Social",
  network: "maium",
  findProfile: "Find the full profile on maium:",
  findProfileShort: "Find this profile on maium",
  formatDuration: () => "3 years",
  formatPeriod: () => "2019/2022",
};

const SAMPLE: ResumePdfData = {
  fullName: "Jane Doe",
  contact: { email: "jane@example.com", phone: "+33 6 00 00 00 00", location: "Paris" },
  summary: "Executive summary of the candidate.",
  socialNetworks: [
    { name: "LinkedIn", handle: "jane-doe", url: "https://linkedin.com/in/jane-doe" },
    { name: "GitHub", handle: "janedoe", url: "https://github.com/janedoe" },
  ],
  pseudo: "jane",
  profileUrl: "https://maium.app/profile/jane",
  profileQrCode:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  experiences: [
    {
      organization: "Goldman Sachs",
      role: "Analyst",
      startPeriod: Date.UTC(2019, 0, 1),
      endPeriod: Date.UTC(2022, 0, 1),
      location: "Paris",
      description: "Built valuation models and led M&A diligence.",
    },
  ],
  skills: ["Financial Modeling", "Valuation", "Excel"],
  education: [
    {
      organization: "HEC Paris",
      role: "MSc Finance",
      startPeriod: Date.UTC(2017, 0, 1),
      endPeriod: Date.UTC(2019, 0, 1),
      location: "Paris",
      description: "Specialized in corporate finance and valuation.",
    },
  ],
};

describe("renderResumePdf", () => {
  it.each(RESUME_TEMPLATES)("renders a non-empty PDF for the %s template", async (template) => {
    const buffer = await renderResumePdf(SAMPLE, template, LABELS);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });
});
