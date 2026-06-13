"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { API } from "@/constants";
import { useStoriesStore } from "@/stores/useStoriesStore";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import type { StoryPosition } from "./StoriesRow";
import { StoryReaderHeader } from "./StoryReaderHeader";
import { StoryProgressBar } from "./StoryProgressBar";
import { StoryReaderContent } from "./StoryReaderContent";
import { StoryActions } from "./StoryActions";

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
 * content / actions. Mobile navigation is tap-left / tap-right; arrow keys and
 * Escape are wired for accessibility.
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
  // author viewing their own story doesn't count as a view (no self-view row).
  const lastViewedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!story || lastViewedRef.current === story.id) return;
    lastViewedRef.current = story.id;
    markSeen(story.id);
    if (story.authorId !== currentUserId) {
      fetch(API.STORY_VIEW(story.id), { method: "POST" }).catch(() => {});
    }
  }, [story, markSeen, currentUserId]);

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-surface-50 fixed inset-0 z-[60]"
    >
      <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col">
        {/* Top: progress + header */}
        <div className="z-20 flex shrink-0 flex-col gap-3 px-4">
          <StoryProgressBar total={group.stories.length} current={storyIndex} />
          <StoryReaderHeader
            author={group.author}
            authorId={story.authorId}
            onClose={onClose}
          />
        </div>

        {/* Content + mobile tap zones (left/right) */}
        <div className="relative min-h-0 flex-1">
          <div className="h-full overflow-hidden px-4 pt-2 pb-28">
            <StoryReaderContent story={story} />
          </div>
          <button
            type="button"
            aria-label={t("previous")}
            onClick={goPrev}
            className="absolute inset-y-0 left-0 z-10 w-1/3 cursor-w-resize"
          />
          <button
            type="button"
            aria-label={t("next")}
            onClick={goNext}
            className="absolute inset-y-0 right-0 z-10 w-1/3 cursor-e-resize"
          />
        </div>

        {/* Actions: pinned to the bottom, above the content/tap zones */}
        <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-8">
          <StoryActions
            story={story}
            authorPseudo={group.author.pseudo}
            onClose={onClose}
          />
        </div>
      </div>
    </motion.div>
  );
}
