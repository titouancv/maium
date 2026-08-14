"use client";

import { useTranslations } from "next-intl";
import { Section, Text } from "@/components/ui";
import { AnonAccountCta } from "./AnonAccountCta";

interface AnonLockedTrackingProps {
  analysisId: string;
}

export function AnonLockedTracking({ analysisId }: AnonLockedTrackingProps) {
  const t = useTranslations("jobs");
  const tAccount = useTranslations("analyze.account");

  return (
    <Section title={t("detail.tracking.title")}>
      <Text tone="muted" size="sm">
        {tAccount("lockedTracking.description")}
      </Text>

      <AnonAccountCta
        label={tAccount("cta.tracking")}
        source="locked_tracking"
        analysisId={analysisId}
      />
    </Section>
  );
}
