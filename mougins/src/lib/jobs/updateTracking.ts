import { API } from "@/constants";
import type { UpdateAnalysisTracking } from "@/lib/validators/job";

export async function updateAnalysisTrackingRequest(
  analysisId: string,
  patch: UpdateAnalysisTracking,
): Promise<boolean> {
  try {
    const res = await fetch(API.ANALYSIS(analysisId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteAnalysisRequest(
  analysisId: string,
): Promise<boolean> {
  try {
    const res = await fetch(API.ANALYSIS(analysisId), { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}
