"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { API } from "@/constants";
import type { HomeNotification } from "@/lib/users";
import { NotificationCard } from "../items";
import { NotificationsOverlay } from "./NotificationsOverlay";

interface NotificationsCenterProps {
  /** Unread count streamed from the home stats (kept live by `useHomeStats`). */
  count: number;
}

/**
 * Owns the home "Notifications" card and its overlay. On open it lazily fetches
 * the list, optimistically clears the badge and persists the read (the next
 * `home-stats` Realtime refetch reconciles, re-bumping the badge for any new
 * event).
 */
export const NotificationsCenter = ({ count }: NotificationsCenterProps) => {
  const t = useTranslations("home.notifications");

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<HomeNotification[]>([]);
  const [loading, setLoading] = useState(false);

  // Local badge override, cleared whenever fresh server `count` streams in
  // (Realtime refetch / navigation) — so opening zeroes the badge while a new
  // event still bumps it back up. Mirrors the re-seed pattern in `useHomeStats`.
  const [override, setOverride] = useState<number | null>(null);
  const [seededCount, setSeededCount] = useState(count);
  if (count !== seededCount) {
    setSeededCount(count);
    setOverride(null);
  }
  const displayCount = override ?? count;

  const openOverlay = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch(API.HOME_NOTIFICATIONS);
      if (res.ok) setItems((await res.json()) as HomeNotification[]);
    } catch {
      // Best-effort; the empty state shows and a reopen retries.
    } finally {
      setLoading(false);
    }
    // Clear the badge now, persist the read in the background.
    setOverride(0);
    void fetch(API.HOME_NOTIFICATIONS_READ, { method: "POST" });
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
