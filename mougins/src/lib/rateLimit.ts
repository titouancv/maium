import { createAdminClient } from "@/lib/supabase/admin";

export function getClientIp(requestHeaders: Headers): string | null {
  const forwarded = requestHeaders.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  return requestHeaders.get("x-real-ip")?.trim() || null;
}

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
