import { ocrDocument } from "@/lib/mistral";
import { CV_TEXT_CHAR_LIMIT } from "@/constants";

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
