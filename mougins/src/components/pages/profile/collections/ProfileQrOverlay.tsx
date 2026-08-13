"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { PageLayout } from "@/components/layout";
import { Overlay, Skeleton } from "@/components/ui";

interface ProfileQrOverlayProps {
  pseudo: string;
  onClose: () => void;
}

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

  return (
    <Overlay onClose={onClose}>
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
    </Overlay>
  );
};
