"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { API, ROUTES } from "@/constants";
import { cn } from "@/lib/utils";
import { useStoriesStore } from "@/stores/useStoriesStore";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import type { StoryData } from "@/types/story";

interface StoryActionsProps {
  story: StoryData;
  authorPseudo: string;
  onClose: () => void;
}

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}

function ActionButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "bg-surface-200/70 text-txt hover:text-primary flex h-12 w-12 cursor-pointer items-center justify-center rounded-full backdrop-blur transition-all active:scale-90 disabled:opacity-40",
        active && "text-primary",
      )}
    >
      {children}
    </button>
  );
}

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const MessageIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const RepostIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

/**
 * Bottom action bar of the reader: send a direct message to the author, like
 * the story (persisted, optimistic), or repost it into your own stories.
 */
export function StoryActions({ story, authorPseudo, onClose }: StoryActionsProps) {
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
    <div className="flex items-center justify-center gap-6">
      <ActionButton
        label={t("message")}
        onClick={handleMessage}
        disabled={busy || isOwn}
      >
        <MessageIcon />
      </ActionButton>
      <ActionButton
        label={t("like")}
        onClick={handleLike}
        active={story.likedByMe}
      >
        <HeartIcon filled={story.likedByMe} />
      </ActionButton>
      <ActionButton
        label={t("repost")}
        onClick={handleRepost}
        disabled={busy || isOwn}
      >
        <RepostIcon />
      </ActionButton>
    </div>
  );
}
