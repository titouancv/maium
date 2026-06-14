"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { API } from "@/constants";
import { useStoriesStore } from "@/stores/useStoriesStore";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { userToSummary } from "@/lib/mappers/user";
import { StoryBlockEditor } from "./StoryBlockEditor";

interface CreateStoryOverlayProps {
  onClose: () => void;
}

/**
 * Full-screen story creation overlay: a Notion-like block editor
 * (`StoryBlockEditor`) that serializes its blocks to markdown. On publish, the
 * story is created and added to the row immediately, then the overlay closes.
 */
export function CreateStoryOverlay({ onClose }: CreateStoryOverlayProps) {
  const t = useTranslations("stories");
  const addStory = useStoriesStore((s) => s.addStory);
  const currentUser = useCurrentUserStore((s) => s.user);

  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const publish = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || !currentUser || isPublishing) return;
    setIsPublishing(true);
    setError(undefined);
    try {
      const res = await fetch(API.STORIES, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (!res.ok) {
        setError(t("error"));
        return;
      }
      const { story } = await res.json();
      addStory(story, userToSummary(currentUser));
      onClose();
    } catch {
      setError(t("error"));
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="bg-surface-50 fixed inset-0 z-[60]"
    >
      <StoryBlockEditor
        onCancel={onClose}
        onPublish={publish}
        isPublishing={isPublishing}
        error={error}
      />
    </motion.div>
  );
}
