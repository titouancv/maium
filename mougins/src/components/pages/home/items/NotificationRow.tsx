"use client";

import { useLocale, useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { formatRelativeTime } from "@/lib/date";
import { UserCard } from "@/components/ui";
import type { HomeNotification } from "@/lib/users";

interface NotificationRowProps {
  notification: HomeNotification;
}

/** i18n key (under `home.notifications`) per notification kind. */
const ACTION_KEY = {
  follow: "actionFollow",
  message: "actionMessage",
  profile_view: "actionProfileView",
} as const;

/**
 * One notification row: the actor's [UserCard] with an action + relative-time
 * subtitle, linking to the conversation (`message`) or the actor's profile.
 */
export const NotificationRow = ({ notification }: NotificationRowProps) => {
  const t = useTranslations("home.notifications");
  const locale = useLocale();
  const { kind, actor, conversationId, createdAt, readAt } = notification;

  const relativeTime = formatRelativeTime(
    new Date(createdAt).getTime(),
    locale,
  );

  const href =
    kind === "message" && conversationId
      ? ROUTES.CONVERSATION(conversationId)
      : ROUTES.PROFILE(actor.pseudo);
  const subtitle = `${t(ACTION_KEY[kind])} · ${relativeTime}`;

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
        subtitleClassName={!readAt ? "text-primary" : undefined}
        showFollow={kind === "follow"}
        initialFollowing={actor.is_following ?? false}
      />
    </li>
  );
};
