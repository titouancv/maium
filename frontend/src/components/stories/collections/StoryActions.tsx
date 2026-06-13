"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { API, ROUTES } from "@/constants";
import { Button } from "@/components/ui";
import { useStoriesStore } from "@/stores/useStoriesStore";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import type { StoryData } from "@/types/story";
import { StoryViewersSheet } from "./StoryViewersSheet";

interface StoryActionsProps {
  story: StoryData;
  authorPseudo: string;
  onClose: () => void;
}

/**
 * Bottom action bar of the reader. On someone else's story: message the author,
 * like (persisted, optimistic), or repost it. On your own story: see who viewed
 * it (viewers sheet) or delete it (two-tap confirm, optimistic removal).
 */
export function StoryActions({
  story,
  authorPseudo,
  onClose,
}: StoryActionsProps) {
  const t = useTranslations("stories");
  const router = useRouter();
  const setLiked = useStoriesStore((s) => s.setLiked);
  const setReposted = useStoriesStore((s) => s.setReposted);
  const addStory = useStoriesStore((s) => s.addStory);
  const removeStory = useStoriesStore((s) => s.removeStory);
  const currentUser = useCurrentUserStore((s) => s.user);
  const [busy, setBusy] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  const handleDelete = async () => {
    if (busy) return;
    // First tap arms the confirmation; second tap actually deletes.
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(API.STORY(story.id), { method: "DELETE" });
      if (res.ok) {
        removeStory(story.id); // optimistic; closes the reader below
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRepost = async () => {
    if (busy || !currentUser) return;
    setBusy(true);
    try {
      // A story can only be reposted once: toggle between creating the repost
      // and removing it.
      if (story.repostedByMe) {
        const res = await fetch(API.STORY_REPOST(story.id), {
          method: "DELETE",
        });
        if (res.ok) {
          const { id } = await res.json();
          setReposted(story.id, false);
          removeStory(id); // drops the repost from the viewer's own group
        }
      } else {
        const res = await fetch(API.STORY_REPOST(story.id), { method: "POST" });
        if (res.ok) {
          const { story: newStory } = await res.json();
          addStory(newStory, {
            pseudo: currentUser.pseudo,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
          });
          setReposted(story.id, true);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  // Own story: manage it (see who viewed it, delete it) instead of reacting to it.
  if (isOwn) {
    return (
      <>
        <div className="flex items-center justify-between gap-2">
          {/* On desktop the viewers list is shown inline (StoryViewersPanel),
              so the button + sheet are mobile-only. */}
          <Button
            variant="outline"
            size="none"
            onClick={() => setShowViewers(true)}
            className="w-full py-2 md:hidden"
          >
            {t("viewers")}
          </Button>
          <Button
            variant="outline"
            size="none"
            onClick={handleDelete}
            disabled={busy}
            className="w-full py-2"
          >
            {confirmDelete ? t("confirmDelete") : t("delete")}
          </Button>
        </div>
        {showViewers && (
          <StoryViewersSheet
            storyId={story.id}
            onClose={() => setShowViewers(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        variant="outline"
        size="none"
        onClick={handleMessage}
        disabled={busy}
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
        variant={story.repostedByMe ? "primary" : "outline"}
        size="none"
        onClick={handleRepost}
        disabled={busy}
        className="w-full py-2"
      >
        {t(story.repostedByMe ? "removeRepost" : "repost")}
      </Button>
    </div>
  );
}
