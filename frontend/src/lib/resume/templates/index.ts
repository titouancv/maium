import type { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ResumeTemplate } from "@/types/job";
import type { ResumePdfData } from "../types";
import { FinanceTemplate } from "./FinanceTemplate";
import { ModernTemplate } from "./ModernTemplate";

const TEMPLATES: Record<
  ResumeTemplate,
  (data: ResumePdfData) => ReactElement<DocumentProps>
> = {
  finance: FinanceTemplate,
  modern: ModernTemplate,
};

/** Returns the template renderer for a layout type (defaults to finance). */
export function getTemplate(type: ResumeTemplate) {
  return TEMPLATES[type] ?? FinanceTemplate;
}
