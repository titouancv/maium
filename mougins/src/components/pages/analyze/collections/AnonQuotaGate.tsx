"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { AnonAccountBenefits } from "./AnonAccountBenefits";

interface AnonQuotaGateProps {
  analysisId: string | null;
  hasPendingJob: boolean;
  onSeeAnalysis: () => void;
}

export function AnonQuotaGate({
  analysisId,
  hasPendingJob,
  onSeeAnalysis,
}: AnonQuotaGateProps) {
  const t = useTranslations("analyze");

  return (
    <div className="flex flex-col gap-6">
      {hasPendingJob && (
        <Text tone="primary">{t("account.gate.offerKept")}</Text>
      )}

      <AnonAccountBenefits
        title={t("gate.title")}
        description={t("gate.description")}
        source="gate"
        analysisId={analysisId ?? undefined}
      />

      {analysisId && (
        <div className="flex">
          <Button variant="outline" onClick={onSeeAnalysis}>
            {t("account.gate.seeAnalysis")}
          </Button>
        </div>
      )}
    </div>
  );
}
