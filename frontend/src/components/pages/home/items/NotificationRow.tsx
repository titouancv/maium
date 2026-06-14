"use client";

import { useLocale, useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { formatRelativeTime } from "@/lib/date";
import { UserCard } from "@/components/ui";
import type { HomeNotification, NotificationKind } from "@/lib/users";

interface NotificationRowProps {
  notification: HomeNotification;
}

/** i18n key (under `home.notifications`) describing each notification kind. */
const ACTION_KEY: Record<NotificationKind, string> = {
  follow: "actionFollow",
  message: "actionMessage",
  profile_view: "actionProfileView",
};

/**
 * One notification row: the actor's card with an action + relative-time
 * subtitle, an unread dot, linking to the source (a `message` → its
 * conversation, otherwise the actor's profile).
 */
export const NotificationRow = ({ notification }: NotificationRowProps) => {
  const t = useTranslations("home.notifications");
  const locale = useLocale();
  const { kind, actor, conversationId, createdAt, readAt } = notification;

  const href =
    kind === "message" && conversationId
      ? ROUTES.CONVERSATION(conversationId)
      : ROUTES.PROFILE(actor.pseudo);

  const relativeTime = formatRelativeTime(new Date(createdAt).getTime(), locale);
  const subtitle = `${t(ACTION_KEY[kind])} · ${relativeTime}`;

  return (
    <li className="flex items-center gap-2">
      <UserCard
        pseudo={actor.pseudo}
        first_name={actor.first_name}
        last_name={actor.last_name}
        href={href}
        subtitle={subtitle}
        className="text-txt hover:text-primary flex min-w-0 flex-1 gap-2 py-3"
      />
      {!readAt && (
        <span
          className="bg-primary mr-1 h-2 w-2 shrink-0 rounded-full"
          aria-hidden
        />
      )}
    </li>
  );
};
