"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Title } from "@/components/ui";

interface GreetingSectionProps {
  firstName: string;
}

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

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const hour = mounted ? new Date().getHours() : null;
  const period = hour !== null ? periodKey(hour) : null;

  const label = period ? t(`greeting.${period}`, { name: firstName }) : firstName;

  return (
    <Title label={label} size="h1" className={cn(!period && "opacity-0")} />
  );
};
