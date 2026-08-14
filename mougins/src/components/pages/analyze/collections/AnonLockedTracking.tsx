"use client";

import { useTranslations } from "next-intl";
import { Section, Text } from "@/components/ui";
import { AnonAccountBenefits } from "./AnonAccountBenefits";

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

      <AnonAccountBenefits
        title={tAccount("title")}
        description={tAccount("description")}
        source="locked_tracking"
        analysisId={analysisId}
      />
    </Section>
  );
}
