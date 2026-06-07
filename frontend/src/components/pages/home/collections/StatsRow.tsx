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
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
      <StatCard
        value={stats.followersCount}
        label={t("stats.followers")}
        href={ROUTES.PROFILE_FOLLOWERS(user.pseudo)}
      />
      <StatCard
        value={stats.followingCount}
        label={t("stats.following")}
        href={ROUTES.PROFILE_FOLLOWING(user.pseudo)}
      />
      <StatCard
        value={stats.unreadCount}
        label={t("stats.unread")}
        href={ROUTES.MESSAGES}
        active={stats.unreadCount > 0}
      />
      <ActionCard
        title={t("actions.analyzeTitle")}
        subtitle={t("actions.analyzeSubtitle")}
        href={ROUTES.JOBS}
        primary
      />
      {!completion.isComplete && (
        <ActionCard
          title={t("actions.completeProfileTitle")}
          subtitle={t("actions.completeProfileSubtitle", {
            percent: completion.percent,
          })}
          href={ROUTES.SETTINGS}
        />
      )}
    </div>
  );
};
