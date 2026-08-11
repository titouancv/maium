import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Client IP for an incoming request, or `null` when it can't be determined.
 *
 * `x-forwarded-for` is a client-controllable header everywhere except behind a
 * proxy that overwrites it — which is the case on Vercel, where the left-most
 * entry is the real peer. A `null` result means "cannot attribute", and callers
 * must decide what that implies rather than silently letting the request through.
 */
export function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  return request.headers.get("x-real-ip")?.trim() || null;
}

/**
 * Per-IP rate limit for endpoints that cost money and don't require an account.
 *
 * Counts previously accepted calls for `operation` from this IP inside the
 * rolling window and, when under the limit, records this one. Returns whether
 * the request may proceed — call it *before* doing the expensive work.
 *
 * Shared IPs (offices, campuses, mobile CGNAT) sit behind a single counter, so
 * limits should be set generously enough not to punish them.
 *
 * Fails **open** on a database error: a limiter outage must not take a working
 * feature down with it. The abuse ceiling is a degraded-mode risk we accept in
 * exchange for availability.
 */
export async function checkAnonRateLimit(params: {
  operation: string;
  clientIp: string;
  limit: number;
  windowMs: number;
}): Promise<boolean> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - params.windowMs).toISOString();

  const { count, error } = await admin
    .from("anon_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("operation", params.operation)
    .eq("client_ip", params.clientIp)
    .gte("created_at", since);

  if (error) return true;
  if ((count ?? 0) >= params.limit) return false;

  await admin
    .from("anon_rate_limits")
    .insert({ operation: params.operation, client_ip: params.clientIp });

  return true;
}
