"use client";

import { useTranslations } from "next-intl";
import { EmptyState, Skeleton } from "@/components/ui";
import type { HomeNotification } from "@/lib/users";
import { NotificationRow } from "../items";

interface NotificationsListProps {
  notifications: HomeNotification[];
  loading: boolean;
}

/** Notifications list: loading skeletons, empty state, or the rows. */
export const NotificationsList = ({
  notifications,
  loading,
}: NotificationsListProps) => {
  const t = useTranslations("home.notifications");

  if (loading) {
    return (
      <ul className="flex flex-col">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex items-center gap-2 py-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex flex-1 flex-col gap-1">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (notifications.length === 0) {
    return <EmptyState label={t("empty")} align="center" />;
  }

  return (
    <ul>
      {notifications.map((notification) => (
        <NotificationRow key={notification.id} notification={notification} />
      ))}
    </ul>
  );
};
