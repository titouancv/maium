"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { getProfileCompletion } from "@/lib/home";
import type { HomeStats } from "@/lib/users";
import type { UserData } from "@/types";
import { useHomeStats } from "@/hooks/useHomeStats";
import { ActionCard, DownloadCvCard } from "../items";
import { NotificationsCenter } from "./NotificationsCenter";

interface StatsRowProps {
  statsPromise: Promise<HomeStats>;
  user: UserData;
}

export const StatsRow = ({ statsPromise, user }: StatsRowProps) => {
  const t = useTranslations("home");
  // Seed from the streamed server stats and keep them live (Realtime refresh).
  const stats = useHomeStats(use(statsPromise), user.id);
  const completion = getProfileCompletion(user);

  return (
    <div className="flex gap-6 overflow-x-auto">
      {!completion.isComplete && (
        <ActionCard
          actionLabel={t("actions.completeProfileTitle")}
          text={t("actions.completeProfileSubtitle", {
            percent: completion.percent,
          })}
          description={t("actions.completeProfileDescription")}
          href={ROUTES.SETTINGS_MY_INFORMATION}
          primary
        />
      )}
      <ActionCard
        actionLabel={t("actions.analyzeTitle")}
        text={t("actions.analyzeSubtitle")}
        description={t("actions.analyzeDescription")}
        href={ROUTES.JOBS}
        primary
      />
      <DownloadCvCard user={user} />
      <NotificationsCenter count={stats.unreadNotificationsCount} />
    </div>
  );
};
