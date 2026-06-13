"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { API } from "@/constants";
import { UserCard, Skeleton } from "@/components/ui";
import type { UserSummary } from "@/types/user";

/**
 * Fetches the viewers of one of the current user's own stories (lazily, on
 * mount). Only the author is authorised server-side. Returns `null` while
 * loading. Shared by the mobile bottom sheet and the desktop inline panel.
 */
export function useStoryViewers(storyId: string): UserSummary[] | null {
  const [viewers, setViewers] = useState<UserSummary[] | null>(null);

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
  viewers: UserSummary[] | null;
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
      <p className="text-txt-muted py-8 text-center text-sm">{t("noViewers")}</p>
    );
  }

  return (
    <ul>
      {viewers.map((viewer) => (
        <li key={viewer.pseudo}>
          <UserCard {...viewer} />
        </li>
      ))}
    </ul>
  );
}
