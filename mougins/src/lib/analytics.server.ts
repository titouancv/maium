import { track } from "@vercel/analytics/server";
import type { ANALYTICS_EVENTS } from "@/constants";

type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export async function trackServerEvent(event: AnalyticsEvent): Promise<void> {
  try {
    await track(event);
  } catch {}
}
