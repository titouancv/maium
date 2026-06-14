"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/layout";
import type { HomeNotification } from "@/lib/users";
import { NotificationsList } from "./NotificationsList";

interface NotificationsOverlayProps {
  notifications: HomeNotification[];
  loading: boolean;
  onClose: () => void;
}

/**
 * Full-screen notifications overlay. Mirrors [SearchOverlay]: a fading
 * `fixed inset-0` layer wrapping a [PageLayout] (titled header + Back button,
 * no navigation bar). The list is fetched lazily by [NotificationsCenter] when
 * the overlay opens.
 */
export const NotificationsOverlay = ({
  notifications,
  loading,
  onClose,
}: NotificationsOverlayProps) => {
  const t = useTranslations("home.notifications");
  const tCommon = useTranslations("common");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="bg-surface-50 fixed inset-0 z-50"
    >
      <PageLayout
        title={t("title")}
        onBack={onClose}
        backLabel={tCommon("backButton")}
        showNavigationBar={false}
      >
        <div className="w-full max-w-7xl">
          <NotificationsList notifications={notifications} loading={loading} />
        </div>
      </PageLayout>
    </motion.div>
  );
};
