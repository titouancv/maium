"use client";

import { useTranslations } from "next-intl";
import { UserCard } from "@/components/ui";
import type { StoryViewer } from "@/types/story";

interface StoryViewersListProps {
  /** Viewers carried with the story (see `StoryData.viewers`). */
  viewers: StoryViewer[];
}

/**
 * Presentational viewers list for one of the current user's own stories: empty
 * state or rows, each flagged with whether the viewer also liked / reposted it.
 * The data ships with the story (fetched once with the feed), so there is no
 * loading state. Shared by the mobile bottom sheet and the desktop inline panel.
 */
export function StoryViewersList({ viewers }: StoryViewersListProps) {
  const t = useTranslations("stories");

  if (viewers.length === 0) {
    return (
      <p className="text-txt-muted py-8 text-center text-sm">
        {t("noViewers")}
      </p>
    );
  }

  return (
    <ul>
      {[...viewers]
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
              <p className="text-primary shrink-0 text-xs">
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
