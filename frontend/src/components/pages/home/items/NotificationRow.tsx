"use client";

import { useLocale, useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { Link } from "@/i18n/navigation";
import { formatRelativeTime } from "@/lib/date";
import { ProfilePhoto, UserCard } from "@/components/ui";
import type { HomeNotification } from "@/lib/users";
import type { UserSummary } from "@/types/user";

interface NotificationRowProps {
  notification: HomeNotification;
  /** Called on click so the parent can close the notifications overlay. */
  onNavigate?: () => void;
}

/** i18n key (under `home.notifications`) for the single-actor kinds. */
const ACTION_KEY = {
  follow: "actionFollow",
  message: "actionMessage",
  profile_view: "actionProfileView",
} as const;

/** Display name for a sentence: first name, falling back to the pseudo. */
const actorName = (actor: UserSummary) => actor.first_name?.trim() || actor.pseudo;

/**
 * One notification row. `follow` / `message` / `profile_view` render the actor's
 * [UserCard]; story likes / reposts render a grouped sentence ("A, B and N
 * others liked your story") that links to the story on the home feed.
 */
export const NotificationRow = ({
  notification,
  onNavigate,
}: NotificationRowProps) => {
  const t = useTranslations("home.notifications");
  const locale = useLocale();
  const { kind, actors, actorCount, conversationId, storyId, createdAt, readAt } =
    notification;

  const relativeTime = formatRelativeTime(
    new Date(createdAt).getTime(),
    locale,
  );

  // Story likes / reposts: a grouped sentence + the most-recent actor's avatar,
  // linking to the story (opened by the home StoriesRow via `?story=`).
  if ((kind === "story_like" || kind === "story_repost") && storyId) {
    const base = kind === "story_like" ? "storyLike" : "storyRepost";
    const label =
      actorCount >= 3
        ? t(`${base}Multiple`, {
            name1: actorName(actors[0]),
            name2: actorName(actors[1]),
            count: actorCount - 2,
          })
        : actorCount === 2
          ? t(`${base}Double`, {
              name1: actorName(actors[0]),
              name2: actorName(actors[1]),
            })
          : t(`${base}Single`, { name: actorName(actors[0]) });

    return (
      <li>
        <Link
          href={ROUTES.STORY(storyId)}
          onClick={onNavigate}
          className="text-txt hover:text-primary flex w-full gap-2 py-3"
        >
          <ProfilePhoto
            pseudo={actors[0].pseudo}
            sizes="40px"
            className="h-10 w-auto self-center"
          />
          <div className="min-w-0 flex-1 text-left">
            <p className="line-clamp-2 text-sm font-extrabold">{label}</p>
            <p
              className={`truncate text-xs ${readAt ? "text-txt-muted" : "text-primary"}`}
            >
              {relativeTime}
            </p>
          </div>
        </Link>
      </li>
    );
  }

  // Single-actor kinds: the actor's card with an action + relative-time subtitle.
  const actor = actors[0];
  const href =
    kind === "message" && conversationId
      ? ROUTES.CONVERSATION(conversationId)
      : ROUTES.PROFILE(actor.pseudo);
  const subtitle = `${t(ACTION_KEY[kind as keyof typeof ACTION_KEY])} · ${relativeTime}`;

  return (
    <li className="flex items-center gap-2">
      <UserCard
        pseudo={actor.pseudo}
        first_name={actor.first_name}
        last_name={actor.last_name}
        href={href}
        subtitle={subtitle}
        subtitleClassName={!readAt ? "text-primary" : undefined}
        showFollow={kind === "follow"}
        initialFollowing={actor.is_following ?? false}
      />
    </li>
  );
};
