"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { PageLayout } from "@/components/layout";
import { Skeleton } from "@/components/ui";

interface ProfileQrOverlayProps {
  pseudo: string;
  onClose: () => void;
}

/**
 * Profile overlay showing only a QR code that points to the public profile URL,
 * so it can be scanned to open the account. The QR is rendered client-side from
 * the current origin and kept on a white card to stay scannable in both themes.
 */
export const ProfileQrOverlay = ({ pseudo, onClose }: ProfileQrOverlayProps) => {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}${ROUTES.PROFILE(pseudo)}`;
    QRCode.toDataURL(url, { margin: 1, width: 320 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [pseudo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="bg-surface-50 fixed inset-0 z-50">
      <PageLayout
        title={t("qrTitle")}
        onBack={onClose}
        backLabel={tCommon("closeButton")}
        fullHeight
      >
        <div className="flex h-full w-full max-w-sm flex-col items-center justify-center gap-6">
          <div className="flex aspect-square w-full max-w-xs items-center justify-center overflow-hidden rounded-2xl bg-white p-4">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={t("qrTitle")}
                className="h-full w-full object-contain"
              />
            ) : (
              <Skeleton className="h-full w-full" />
            )}
          </div>
        </div>
      </PageLayout>
    </div>
  );
};
