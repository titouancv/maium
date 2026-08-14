import { createAdminClient } from "@/lib/supabase/admin";
import {
  ANALYSES_PER_HOUR,
  ANON_ANALYSES_PER_IP_PER_DAY,
  DAY_MS,
} from "@/constants";

export async function isAnonUnderQuota(params: {
  anonId: string | null;
  clientIp: string;
}): Promise<boolean> {
  const admin = createAdminClient();

  if (params.anonId) {
    const { count: ownCount } = await admin
      .from("analysis_jobs")
      .select("id", { count: "exact", head: true })
      .eq("anon_id", params.anonId);
    if ((ownCount ?? 0) >= 1) return false;
  }

  const since = new Date(Date.now() - DAY_MS).toISOString();
  const { count: ipCount } = await admin
    .from("analysis_jobs")
    .select("id", { count: "exact", head: true })
    .eq("client_ip", params.clientIp)
    .gte("created_at", since);
  return (ipCount ?? 0) < ANON_ANALYSES_PER_IP_PER_DAY;
}

export async function isUnderRateLimit(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("analysis_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  return (count ?? 0) < ANALYSES_PER_HOUR;
}

export async function incrementUsage(userId: string): Promise<void> {
  const admin = createAdminClient();
  const periodStart = new Date();
  periodStart.setUTCDate(1);
  periodStart.setUTCHours(0, 0, 0, 0);
  const periodStartDate = periodStart.toISOString().slice(0, 10);

  const { data: existing } = await admin
    .from("user_usage")
    .select("analyses_this_month, period_start")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    await admin.from("user_usage").insert({
      user_id: userId,
      analyses_this_month: 1,
      period_start: periodStartDate,
    });
    return;
  }

  const sameMonth = existing.period_start === periodStartDate;
  await admin
    .from("user_usage")
    .update({
      analyses_this_month: sameMonth
        ? (existing.analyses_this_month ?? 0) + 1
        : 1,
      period_start: periodStartDate,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}
