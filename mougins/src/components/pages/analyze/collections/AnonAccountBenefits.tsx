"use client";

import { useTranslations } from "next-intl";
import { ROUTES, type SigninSource } from "@/constants";
import { GoogleSignInButton } from "@/components/ui/GoogleSignInButton";
import { Title } from "@/components/ui/Title";
import { Text } from "@/components/ui/Text";
import { Rail } from "@/components/ui/Rail";

const BENEFIT_KEYS = [
  "unlimited",
  "history",
  "tracking",
  "reminders",
  "contacts",
  "frenchResume",
  "profile",
  "network",
] as const;

interface AnonAccountBenefitsProps {
  title: string;
  description: string;
  source: SigninSource;
  analysisId?: string;
}

export function AnonAccountBenefits({
  title,
  description,
  source,
  analysisId,
}: AnonAccountBenefitsProps) {
  const t = useTranslations("analyze.account");

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Title label={title} size="h3" />
        <Text tone="muted" size="sm">
          {description}
        </Text>
      </div>

      <ul className="flex flex-col gap-3">
        {BENEFIT_KEYS.map((key) => (
          <li key={key} className="text-txt-muted flex gap-3">
            <Rail />
            <Text className="min-w-0">{t(`benefits.${key}`)}</Text>
          </li>
        ))}
      </ul>

      <GoogleSignInButton
        className="max-w-sm"
        source={source}
        next={analysisId ? ROUTES.JOB_ANALYSIS(analysisId) : undefined}
      />
    </div>
  );
}
