"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { getTodayEvent } from "@/lib/home";

interface GreetingSectionProps {
  firstName: string;
}

/** Maps a 24h hour to a greeting period key. */
function periodKey(hour: number): "night" | "morning" | "afternoon" | "evening" {
  if (hour < 6) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export const GreetingSection = ({ firstName }: GreetingSectionProps) => {
  const t = useTranslations("home");

  // Resolve the time-based greeting only after mount: server and first client
  // render both treat `mounted` as false, so there's no hydration mismatch on
  // the clock; the real time is read once the client takes over.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const now = mounted ? new Date() : null;

  const period = now ? periodKey(now.getHours()) : null;
  const event = now ? getTodayEvent(now) : null;

  return (
    <div className="flex shrink-0 flex-col gap-1">
      <h1 className="text-2xl font-extrabold sm:text-3xl">
        {period ? (
          t(`greeting.${period}`, { name: firstName })
        ) : (
          <span className="opacity-0">{firstName}</span>
        )}
      </h1>
      {event && (
        <p className="text-primary text-sm font-medium">
          {t(`events.${event.key}`)}
        </p>
      )}
    </div>
  );
};
