import type { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ResumeTemplate } from "@/types/job";
import type { ResumePdfData } from "../types";
import type { ResumeLabels } from "../labels";
import { FinanceTemplate } from "./FinanceTemplate";
import { ModernTemplate } from "./ModernTemplate";

const TEMPLATES: Record<
  ResumeTemplate,
  (data: ResumePdfData, labels: ResumeLabels) => ReactElement<DocumentProps>
> = {
  finance: FinanceTemplate,
  modern: ModernTemplate,
};

export function getTemplate(type: ResumeTemplate) {
  return TEMPLATES[type] ?? FinanceTemplate;
}
