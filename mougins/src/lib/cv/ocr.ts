import { ocrDocument } from "@/lib/mistral";
import { CV_TEXT_CHAR_LIMIT } from "@/constants";

/**
 * OCRs a CV (PDF or image) into markdown.
 *
 * The bytes stay in memory for the length of the call — the file is never
 * written to Storage or the database, for signed-in users as much as for
 * anonymous visitors.
 *
 * Output is capped at `CV_TEXT_CHAR_LIMIT`: a CV is untrusted input, and the
 * cap is the token guardrail on the parsing call that follows (same role as
 * `JOB_TEXT_CHAR_LIMIT` for job postings).
 */
export async function extractCvMarkdown(params: {
  data: Uint8Array;
  mimeType: string;
  userId: string | null;
}): Promise<string> {
  const markdown = await ocrDocument({
    operation: "cv_ocr",
    userId: params.userId,
    data: params.data,
    mimeType: params.mimeType,
  });
  return markdown.slice(0, CV_TEXT_CHAR_LIMIT);
}
