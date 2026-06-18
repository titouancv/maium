import { createAdminClient } from "@/lib/supabase/admin";
import { ANALYSES_PER_HOUR } from "@/constants";

/**
 * Rate-limit: true when the user is under the per-hour analysis cap. Counts
 * `analysis_jobs` created in the last rolling hour via the admin client.
 */
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

/** Increments the user's monthly usage counter (best-effort, server-side). */
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
