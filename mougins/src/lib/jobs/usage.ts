import { createAdminClient } from "@/lib/supabase/admin";
import {
  ANALYSES_PER_HOUR,
  ANON_ANALYSES_PER_IP_PER_DAY,
  DAY_MS,
} from "@/constants";

/**
 * Whether a signed-out visitor may run an analysis.
 *
 * Two barriers, both server-side and evaluated before any paid call:
 *
 *  1. `anon_id` — one free run per browser. The `maium_anon_used` cookie is the
 *     nominal check (see lib/auth/anonSession); this catches the case where
 *     that cookie is gone but the session one survives.
 *  2. IP — the backstop for clearing cookies entirely. Deliberately above 1 so
 *     a shared office or CGNAT address isn't locked out by one colleague.
 *
 * Signing in is what actually lifts the limit, which is the whole conversion
 * argument, so this stays strict.
 */
export async function isAnonUnderQuota(params: {
  anonId: string;
  clientIp: string;
}): Promise<boolean> {
  const admin = createAdminClient();

  const { count: ownCount } = await admin
    .from("analysis_jobs")
    .select("id", { count: "exact", head: true })
    .eq("anon_id", params.anonId);
  if ((ownCount ?? 0) >= 1) return false;

  const since = new Date(Date.now() - DAY_MS).toISOString();
  const { count: ipCount } = await admin
    .from("analysis_jobs")
    .select("id", { count: "exact", head: true })
    .eq("client_ip", params.clientIp)
    .gte("created_at", since);
  return (ipCount ?? 0) < ANON_ANALYSES_PER_IP_PER_DAY;
}

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
