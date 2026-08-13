"use client";

import { useLocale, useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { Link } from "@/i18n/navigation";
import { formatRelativeTime } from "@/lib/date";
import { Rail, UserCard } from "@/components/ui";
import type { HomeNotification } from "@/lib/users";

interface NotificationRowProps {
  notification: HomeNotification;
}

const ACTION_KEY = {
  follow: "actionFollow",
  message: "actionMessage",
  profile_view: "actionProfileView",
  analysis_snooze: "actionAnalysisSnooze",
} as const;

export const NotificationRow = ({ notification }: NotificationRowProps) => {
  const t = useTranslations("home.notifications");
  const tJobs = useTranslations("jobs");
  const locale = useLocale();
  const { kind, actor, analysis, conversationId, createdAt, readAt } =
    notification;

  const relativeTime = formatRelativeTime(
    new Date(createdAt).getTime(),
    locale,
  );
  const subtitle = `${t(ACTION_KEY[kind])} · ${relativeTime}`;
  const subtitleClassName = readAt ? undefined : "text-primary";

  if (kind === "analysis_snooze") {
    if (!analysis) return null;

    return (
      <li>
        <Link
          href={ROUTES.JOB_ANALYSIS(analysis.id)}
          className="text-txt hover:text-primary flex w-full gap-2 py-3"
        >
          <Rail className={readAt ? "text-txt-muted" : "text-primary"} />
          <div className="min-w-0 flex-1">
            <p className="text-md truncate font-extrabold">
              {analysis.title || tJobs("untitledJob")}
            </p>
            <p
              className={`truncate text-xs ${subtitleClassName ?? "text-txt-muted"}`}
            >
              {analysis.company
                ? `${analysis.company} · ${subtitle}`
                : subtitle}
            </p>
          </div>
        </Link>
      </li>
    );
  }

  if (!actor) return null;

  const href =
    kind === "message" && conversationId
      ? ROUTES.CONVERSATION(conversationId)
      : ROUTES.PROFILE(actor.pseudo);

  return (
    <li className="flex items-center gap-2">
      <UserCard
        pseudo={actor.pseudo}
        first_name={actor.first_name}
        last_name={actor.last_name}
        profilePhoto={actor.profile_photo}
        gender={actor.gender}
        href={href}
        subtitle={subtitle}
        subtitleClassName={subtitleClassName}
        showFollow={kind === "follow"}
        initialFollowing={actor.is_following ?? false}
      />
    </li>
  );
};
