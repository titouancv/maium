import { headers } from "next/headers";
import { getAnonId, hasUsedFreeAnalysis } from "@/lib/auth/anonSession";
import { getClientIp } from "@/lib/rateLimit";
import { isAnonUnderQuota } from "@/lib/jobs/usage";

export async function isAnonQuotaExhausted(): Promise<boolean> {
  if (await hasUsedFreeAnalysis()) return true;

  const clientIp = getClientIp(await headers());
  if (!clientIp) return false;

  const anonId = await getAnonId();
  return !(await isAnonUnderQuota({ anonId, clientIp }));
}
