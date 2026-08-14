import { track } from "@vercel/analytics";
import type { ANALYTICS_EVENTS } from "@/constants";

type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

type AnalyticsProperties = Record<string, string | number | boolean | null>;

export function trackEvent(
  event: AnalyticsEvent,
  properties?: AnalyticsProperties,
): void {
  try {
    track(event, properties);
  } catch {}
}
