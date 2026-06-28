"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Title } from "@/components/ui";

interface GreetingSectionProps {
  firstName: string;
}

/** Maps a 24h hour to a greeting period key. */
function periodKey(
  hour: number,
): "night" | "morning" | "afternoon" | "evening" {
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
  const hour = mounted ? new Date().getHours() : null;
  const period = hour !== null ? periodKey(hour) : null;

  // Rendered as a classic page Title. Before mount we show the (invisible) name
  // to reserve the title height and avoid a layout shift / greeting flash once
  // the clock resolves.
  const label = period ? t(`greeting.${period}`, { name: firstName }) : firstName;

  return (
    <Title label={label} size="h1" className={cn(!period && "opacity-0")} />
  );
};
