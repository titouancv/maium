import { renderToBuffer } from "@react-pdf/renderer";
import { RESUME_TEMPLATES, type ResumeTemplate } from "@/types/job";
import { getTemplate } from "../templates";
import { registerResumeFonts } from "../fonts";
import type { ResumePdfData } from "../types";
import type { ResumeLabels } from "../labels";

export async function renderResumePdf(
  data: ResumePdfData,
  template: ResumeTemplate,
  labels: ResumeLabels,
): Promise<Buffer> {
  registerResumeFonts();
  return renderToBuffer(getTemplate(template)(data, labels));
}

export function resolveTemplate(value: string | null): ResumeTemplate {
  return RESUME_TEMPLATES.includes(value as ResumeTemplate)
    ? (value as ResumeTemplate)
    : "finance";
}

function fileSlug(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "Resume"
  );
}

export function pdfResponse(pdf: Buffer | Uint8Array, fullName: string): Response {
  const filename = `CV_${fileSlug(fullName)}.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
