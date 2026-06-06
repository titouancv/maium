import { renderToBuffer } from "@react-pdf/renderer";
import type { ResumeTemplate } from "@/types/job";
import { getTemplate } from "../templates";
import type { ResumePdfData } from "../types";

/** Renders resume data to a PDF Buffer using the chosen template. */
export async function renderResumePdf(
  data: ResumePdfData,
  template: ResumeTemplate,
): Promise<Buffer> {
  return renderToBuffer(getTemplate(template)(data));
}
