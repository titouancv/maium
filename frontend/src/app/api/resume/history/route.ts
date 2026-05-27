import { authenticatedFetch, BACKEND_ROUTES, toNextResponse } from "@/lib/server/authenticated-fetch";
import type { ResumeHistoryResponse } from "@/lib/server/resume-types";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await authenticatedFetch<ResumeHistoryResponse>(BACKEND_ROUTES.RESUME_HISTORY);
  return toNextResponse(result);
}
