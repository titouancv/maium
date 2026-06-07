"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { getProfileCompletion } from "@/lib/home";
import type { HomeStats } from "@/lib/users";
import type { UserData } from "@/types";
import { StatCard, ActionCard } from "../items";

interface StatsRowProps {
  statsPromise: Promise<HomeStats>;
  user: UserData;
}

export const StatsRow = ({ statsPromise, user }: StatsRowProps) => {
  const t = useTranslations("home");
  const stats = use(statsPromise);
  const completion = getProfileCompletion(user);

  return (
    <div className="-mx-1 flex gap-6 overflow-x-auto px-1 pb-1">
      <StatCard
        value={stats.followersCount}
        label={t("stats.followers")}
        href={ROUTES.PROFILE_FOLLOWERS(user.pseudo)}
        trend={-10}
        trendTitle={t("stats.trendTitle")}
      />
      <StatCard
        value={stats.unreadCount}
        label={t("stats.unread")}
        href={ROUTES.MESSAGES}
      />
      <ActionCard
        actionLabel={t("actions.analyzeTitle")}
        text={t("actions.analyzeSubtitle")}
        href={ROUTES.JOBS}
        primary
      />
      {!completion.isComplete && (
        <ActionCard
          actionLabel={t("actions.completeProfileTitle")}
          text={t("actions.completeProfileSubtitle", {
            percent: completion.percent,
          })}
          href={ROUTES.SETTINGS}
        />
      )}
    </div>
  );
};
