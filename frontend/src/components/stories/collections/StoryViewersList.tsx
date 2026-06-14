"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { API } from "@/constants";
import { UserCard, Skeleton } from "@/components/ui";
import type { StoryViewer } from "@/types/story";

/**
 * Fetches the viewers of one of the current user's own stories (lazily, on
 * mount), each flagged with whether they liked / reposted it. Only the author
 * is authorised server-side. Returns `null` while loading. Shared by the mobile
 * bottom sheet and the desktop inline panel.
 */
export function useStoryViewers(storyId: string): StoryViewer[] | null {
  const [viewers, setViewers] = useState<StoryViewer[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch(API.STORY_VIEWERS(storyId))
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => {
        if (active) setViewers(data.users ?? []);
      })
      .catch(() => {
        if (active) setViewers([]);
      });
    return () => {
      active = false;
    };
  }, [storyId]);

  return viewers;
}

interface StoryViewersListProps {
  /** Viewers from `useStoryViewers`; `null` renders the loading skeleton. */
  viewers: StoryViewer[] | null;
}

/** Presentational viewers list: skeleton while loading, empty state, or rows. */
export function StoryViewersList({ viewers }: StoryViewersListProps) {
  const t = useTranslations("stories");

  if (viewers === null) {
    return (
      <div className="flex flex-col gap-3 py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-sm" />
        ))}
      </div>
    );
  }

  if (viewers.length === 0) {
    return (
      <p className="text-txt-muted py-8 text-center text-sm">
        {t("noViewers")}
      </p>
    );
  }

  return (
    <ul>
      {viewers
        .sort(
          (a, b) =>
            Number(b.liked) - Number(a.liked) ||
            Number(b.reposted) - Number(a.reposted),
        )
        .map(({ liked, reposted, ...summary }) => (
          <li key={summary.pseudo} className="flex items-center gap-2">
            <UserCard
              {...summary}
              className="text-txt hover:text-primary flex min-w-0 flex-1 gap-2 py-3"
            />
            {(liked || reposted) && (
              <p className="text-primary shrink-0 text-xs font-medium">
                {liked && reposted
                  ? t("likedAndReposted")
                  : liked
                    ? t("likedIndicator")
                    : t("repostedIndicator")}
              </p>
            )}
          </li>
        ))}
    </ul>
  );
}
