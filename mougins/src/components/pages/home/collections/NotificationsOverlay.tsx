"use client";

import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/layout";
import { Overlay } from "@/components/ui";
import type { HomeNotification } from "@/lib/users";
import { NotificationsList } from "./NotificationsList";

interface NotificationsOverlayProps {
  notifications: HomeNotification[];
  loading: boolean;
  onClose: () => void;
}

/**
 * Full-screen notifications overlay: an [Overlay] wrapping a [PageLayout]
 * (titled header + Back button, no navigation bar). The list is fetched lazily
 * by [NotificationsCenter] when the overlay opens.
 */
export const NotificationsOverlay = ({
  notifications,
  loading,
  onClose,
}: NotificationsOverlayProps) => {
  const t = useTranslations("home.notifications");
  const tCommon = useTranslations("common");

  return (
    <Overlay onClose={onClose}>
      <PageLayout
        title={t("title")}
        onBack={onClose}
        backLabel={tCommon("backButton")}
        showNavigationBar={false}
      >
        <div className="w-full max-w-2xl">
          <NotificationsList notifications={notifications} loading={loading} />
        </div>
      </PageLayout>
    </Overlay>
  );
};
