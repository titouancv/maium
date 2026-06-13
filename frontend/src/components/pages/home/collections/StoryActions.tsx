"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { API, ROUTES } from "@/constants";
import { Button } from "@/components/ui";
import { useStoriesStore } from "@/stores/useStoriesStore";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import type { StoryData } from "@/types/story";

interface StoryActionsProps {
  story: StoryData;
  authorPseudo: string;
  onClose: () => void;
}

/**
 * Bottom action bar of the reader: send a direct message to the author, like
 * the story (persisted, optimistic), or repost it into your own stories.
 */
export function StoryActions({
  story,
  authorPseudo,
  onClose,
}: StoryActionsProps) {
  const t = useTranslations("stories");
  const router = useRouter();
  const setLiked = useStoriesStore((s) => s.setLiked);
  const addStory = useStoriesStore((s) => s.addStory);
  const currentUser = useCurrentUserStore((s) => s.user);
  const [busy, setBusy] = useState(false);

  const isOwn = currentUser?.id === story.authorId;

  const handleLike = async () => {
    const next = !story.likedByMe;
    setLiked(story.id, next); // optimistic
    try {
      const res = await fetch(API.STORY_LIKE(story.id), {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) setLiked(story.id, !next);
    } catch {
      setLiked(story.id, !next); // revert on failure
    }
  };

  const handleMessage = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(API.MESSAGES_CONVERSATIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPseudo: authorPseudo }),
      });
      if (res.ok) {
        const { conversationId } = await res.json();
        onClose();
        router.push(ROUTES.CONVERSATION(conversationId));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRepost = async () => {
    if (busy || !currentUser) return;
    setBusy(true);
    try {
      const res = await fetch(API.STORY_REPOST(story.id), { method: "POST" });
      if (res.ok) {
        const { story: newStory } = await res.json();
        addStory(newStory, {
          pseudo: currentUser.pseudo,
          first_name: currentUser.first_name,
          last_name: currentUser.last_name,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        variant="outline"
        size="none"
        onClick={handleMessage}
        disabled={busy || isOwn}
        className="w-full py-2"
      >
        {t("message")}
      </Button>
      <Button
        variant={story.likedByMe ? "primary" : "outline"}
        size="none"
        onClick={handleLike}
        className="w-full py-2"
      >
        {t("like")}
      </Button>
      <Button
        variant="outline"
        size="none"
        onClick={handleRepost}
        disabled={busy || isOwn}
        className="w-full py-2"
      >
        {t("repost")}
      </Button>
    </div>
  );
}
