"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { API } from "@/constants";
import { useMediaQuery } from "@/hooks";
import { useStoriesStore } from "@/stores/useStoriesStore";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { Button } from "@/components/ui";
import type { StoryPosition } from "./StoriesRow";
import { StoryReaderHeader } from "./StoryReaderHeader";
import { StoryProgressBar } from "./StoryProgressBar";
import { StoryReaderContent } from "./StoryReaderContent";
import { StoryActions } from "./StoryActions";
import { StoryViewersPanel } from "./StoryViewersPanel";

interface StoryReaderOverlayProps {
  start: StoryPosition;
  onClose: () => void;
}

/** Stable pointer into the feed (survives store re-ordering, e.g. on repost). */
interface Cursor {
  pseudo: string;
  storyId: string;
}

/**
 * Full-screen, app-independent story reader. Navigates story-by-story within an
 * author then across authors (wrapping to the previous/next author's edge
 * story), marks each opened story seen, and renders the header / progress /
 * content / actions. Mobile navigation is tap-left / tap-right; desktop uses
 * explicit prev/next buttons under the content. Arrow keys and Escape are wired
 * for accessibility on both.
 *
 * Position is tracked by author pseudo + story id (not array indices) so a
 * store re-order — e.g. when the viewer reposts from here and their own group
 * jumps to the front — never makes the reader jump to the wrong story.
 */
export function StoryReaderOverlay({
  start,
  onClose,
}: StoryReaderOverlayProps) {
  const t = useTranslations("stories");
  const groups = useStoriesStore((s) => s.groups);
  const markSeen = useStoriesStore((s) => s.markSeen);
  const currentUserId = useCurrentUserStore((s) => s.user?.id);
  // Desktop shows the viewers list inline under the actions; mobile uses a sheet.
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [cursor, setCursor] = useState<Cursor>(() => {
    const g = groups[start.groupIndex];
    return {
      pseudo: g?.author.pseudo ?? "",
      storyId: g?.stories[start.storyIndex]?.id ?? "",
    };
  });

  const groupIndex = groups.findIndex((g) => g.author.pseudo === cursor.pseudo);
  const group = groupIndex >= 0 ? groups[groupIndex] : undefined;
  const storyIndex = group
    ? group.stories.findIndex((s) => s.id === cursor.storyId)
    : -1;
  const story = storyIndex >= 0 ? group?.stories[storyIndex] : undefined;

  // Mark the open story as seen (optimistic + persisted), once per story. The
  // author's view of their own story is persisted too so the unseen ring stays
  // gone after a hard refresh; the viewers list still excludes the author.
  const lastViewedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!story || lastViewedRef.current === story.id) return;
    lastViewedRef.current = story.id;
    markSeen(story.id);
    fetch(API.STORY_VIEW(story.id), { method: "POST" }).catch(() => {});
  }, [story, markSeen]);

  const goNext = useCallback(() => {
    if (!group || storyIndex < 0) return;
    if (storyIndex < group.stories.length - 1) {
      setCursor({
        pseudo: cursor.pseudo,
        storyId: group.stories[storyIndex + 1].id,
      });
    } else if (groupIndex < groups.length - 1) {
      const next = groups[groupIndex + 1];
      setCursor({ pseudo: next.author.pseudo, storyId: next.stories[0].id });
    } else {
      onClose(); // past the last story of the last author
    }
  }, [groups, group, groupIndex, storyIndex, cursor.pseudo, onClose]);

  const goPrev = useCallback(() => {
    if (!group || storyIndex < 0) return;
    if (storyIndex > 0) {
      setCursor({
        pseudo: cursor.pseudo,
        storyId: group.stories[storyIndex - 1].id,
      });
    } else if (groupIndex > 0) {
      const prev = groups[groupIndex - 1];
      setCursor({
        pseudo: prev.author.pseudo,
        storyId: prev.stories[prev.stories.length - 1].id,
      });
    }
    // already at the very first story: stay put
  }, [groups, group, groupIndex, storyIndex, cursor.pseudo]);

  // Keyboard navigation + close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, onClose]);

  // Lock background scroll while the reader is open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (!group || !story) return null;

  // On a repost, the header shows the *original* author (and links to their
  // profile); otherwise the group's own author. Keying the header roll by this
  // id keeps the user-switch animation when navigating across authors/reposts.
  const headerAuthor =
    story.isRepost && story.originalAuthor
      ? story.originalAuthor
      : group.author;
  const headerAuthorId =
    story.isRepost && story.originalAuthorId
      ? story.originalAuthorId
      : story.authorId;

  // On the author's own story, desktop shows the viewers list inline under the
  // actions (mobile keeps the button + sheet inside StoryActions).
  const isOwn = currentUserId === story.authorId;

  // Start of the whole feed: disable the desktop "previous" button. There is no
  // matching "next" edge — on the last story, "next" closes the reader instead.
  const isFirst = groupIndex === 0 && storyIndex === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-surface-50 fixed inset-0 z-[60]"
    >
      <div className="relative mx-auto flex h-dvh w-full max-w-7xl flex-col">
        {/* Progress: always full-width, above both columns. */}
        <div className="z-20 shrink-0 px-4 py-2">
          <StoryProgressBar total={group.stories.length} current={storyIndex} />
        </div>

        {/*
         * Below the progress bar, a grid whose named areas reflow per breakpoint:
         * - mobile: header → content → actions, stacked (one column).
         * - desktop: two columns — content on the left; header, actions and
         *   (on your own story) the inline viewers list in the right panel.
         */}
        <div className="relative grid min-h-0 flex-1 grid-cols-1 grid-rows-[auto_1fr_auto] [grid-template-areas:'header'_'content'_'actions'] md:grid-cols-[3fr_2fr] md:grid-rows-[auto_auto_1fr] md:[grid-template-areas:'content_header'_'content_actions'_'content_viewers']">
          {/* Header */}
          <div className="z-20 px-4 [grid-area:header]">
            <StoryReaderHeader
              author={headerAuthor}
              authorId={headerAuthorId}
              createdAt={story.createdAt}
              isRepost={story.isRepost}
              reposterPseudo={group.author.pseudo}
              likeCount={story.likeCount}
              repostCount={story.repostCount}
              onClose={onClose}
            />
          </div>

          {/* Content + navigation: tap zones on mobile, explicit prev/next
              buttons under the content on desktop. */}
          <div className="relative flex min-h-0 flex-col overflow-hidden [grid-area:content]">
            <div className="min-h-0 flex-1 overflow-hidden px-4 pt-2 pb-4">
              <StoryReaderContent story={story} />
            </div>

            {/* Mobile-only tap zones (left = previous, right = next). */}
            <button
              type="button"
              aria-label={t("previous")}
              onClick={goPrev}
              className="absolute inset-y-0 left-0 z-10 w-1/3 cursor-w-resize md:hidden"
            />
            <button
              type="button"
              aria-label={t("next")}
              onClick={goNext}
              className="absolute inset-y-0 right-0 z-10 w-1/3 cursor-e-resize md:hidden"
            />

            {/* Desktop-only nav buttons at the bottom of the content. */}
            <div className="z-20 hidden shrink-0 items-center justify-between gap-2 px-4 pb-4 md:flex">
              <Button
                variant="outline"
                size="none"
                onClick={goPrev}
                disabled={isFirst}
                className="w-full px-4 py-2"
              >
                {t("previous")}
              </Button>
              <Button
                variant="outline"
                size="none"
                onClick={goNext}
                className="w-full px-4 py-2"
              >
                {t("next")}
              </Button>
            </div>
          </div>

          {/* Actions: bottom on mobile, under the header on desktop */}
          <div className="z-20 px-4 pt-2 pb-8 [grid-area:actions] md:py-4">
            <StoryActions
              story={story}
              authorPseudo={group.author.pseudo}
              onClose={onClose}
            />
          </div>

          {/* Desktop-only: own-story viewers, inline under the actions. */}
          {isDesktop && isOwn && (
            <div className="z-20 flex min-h-0 flex-col overflow-hidden px-4 py-6 [grid-area:viewers]">
              <StoryViewersPanel viewers={story.viewers} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
