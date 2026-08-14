"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, InfoMessage, Text } from "@/components/ui";
import { ROUTES } from "@/constants";
import { useRouter } from "@/i18n/navigation";
import { deleteAnalysisRequest } from "@/lib/jobs/updateTracking";

interface DeleteAnalysisButtonProps {
  analysisId: string;
}

export function DeleteAnalysisButton({
  analysisId,
}: DeleteAnalysisButtonProps) {
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [failed, setFailed] = useState(false);

  const confirmDelete = async () => {
    setIsDeleting(true);
    setFailed(false);
    const ok = await deleteAnalysisRequest(analysisId);
    if (!ok) {
      setIsDeleting(false);
      setFailed(true);
      return;
    }
    router.push(ROUTES.JOBS_HISTORY);
    router.refresh();
  };

  return (
    <div className="flex max-w-3xl flex-col gap-2">
      <Text className="font-extrabold" size="lg">
        {t("detail.delete.title")}
      </Text>
      {isConfirming ? (
        <>
          <Text tone="muted" size="sm">
            {t("detail.delete.confirmHint")}
          </Text>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              isLoading={isDeleting}
              onClick={confirmDelete}
            >
              {t("detail.delete.confirmButton")}
            </Button>
            {!isDeleting && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsConfirming(false)}
              >
                {tCommon("cancelButton")}
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <Text tone="muted" size="sm">
            {t("detail.delete.hint")}
          </Text>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfirming(true)}
            >
              {t("detail.delete.button")}
            </Button>
          </div>
        </>
      )}
      <InfoMessage message={failed ? t("detail.delete.error") : null} />
    </div>
  );
}
