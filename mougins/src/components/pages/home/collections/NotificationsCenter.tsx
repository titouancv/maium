"use client";

import { use, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { API } from "@/constants";
import { useHomeStats } from "@/hooks/useHomeStats";
import type { HomeNotification, HomeStats } from "@/lib/users";
import { NotificationCard } from "../items";
import { NotificationsOverlay } from "./NotificationsOverlay";

interface NotificationsCenterProps {
  statsPromise: Promise<HomeStats>;
  userId?: string;
}

export const NotificationsCenter = ({
  statsPromise,
  userId,
}: NotificationsCenterProps) => {
  const t = useTranslations("home.notifications");

  const count = useHomeStats(use(statsPromise), userId).unreadNotificationsCount;

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<HomeNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const [override, setOverride] = useState<number | null>(null);
  const [seededCount, setSeededCount] = useState(count);
  if (count !== seededCount) {
    setSeededCount(count);
    setOverride(null);
  }
  const displayCount = override ?? count;

  const openOverlay = async () => {
    setOpen(true);
    setOverride(0);
    void fetch(API.HOME_NOTIFICATIONS_READ, { method: "POST" });

    setLoading(true);
    try {
      const res = await fetch(API.HOME_NOTIFICATIONS);
      if (res.ok) setItems((await res.json()) as HomeNotification[]);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NotificationCard
        count={displayCount}
        label={t("label")}
        onClick={openOverlay}
      />
      <AnimatePresence>
        {open && (
          <NotificationsOverlay
            notifications={items}
            loading={loading}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
