"use client";

import { use, useLayoutEffect } from "react";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { getProfileCompletion } from "@/lib/home";
import type { HomeStats } from "@/lib/users";
import type { UserData } from "@/types";
import { useHomeStatsStore } from "@/stores/useHomeStatsStore";
import { StatCard, ActionCard, DownloadCvCard } from "../items";

interface StatsRowProps {
  statsPromise: Promise<HomeStats>;
  user: UserData;
}

export const StatsRow = ({ statsPromise, user }: StatsRowProps) => {
  const t = useTranslations("home");
  const streamed = use(statsPromise);
  const completion = getProfileCompletion(user);

  // Seed the live store with the freshly streamed server stats, then read from
  // it so the Realtime refreshes from [HomeStatsRealtime] update the cards in
  // place. Falls back to the streamed value until the first seed.
  useLayoutEffect(() => {
    useHomeStatsStore.getState().setStats(streamed);
  }, [streamed]);
  const stats = useHomeStatsStore((s) => s.stats) ?? streamed;

  return (
    <div className="-mx-1 flex gap-6 overflow-x-auto px-1 pb-1">
      {!completion.isComplete && (
        <ActionCard
          actionLabel={t("actions.completeProfileTitle")}
          text={t("actions.completeProfileSubtitle", {
            percent: completion.percent,
          })}
          description={t("actions.completeProfileDescription")}
          href={ROUTES.SETTINGS}
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
      <StatCard
        value={stats.followersCount}
        label={t("stats.followers")}
        href={ROUTES.PROFILE_FOLLOWERS(user.pseudo)}
        trend={stats.followersTrend}
        trendTitle={t("stats.trendTitle")}
      />
      <StatCard
        value={stats.profileViewsCount}
        label={t("stats.profileViews")}
        href={ROUTES.PROFILE(user.pseudo)}
      />
      <StatCard
        value={stats.unreadCount}
        label={t("stats.unread")}
        href={ROUTES.MESSAGES}
      />
    </div>
  );
};
