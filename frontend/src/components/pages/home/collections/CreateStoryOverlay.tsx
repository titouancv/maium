"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { API } from "@/constants";
import { Form } from "@/components/form";
import { useStoriesStore } from "@/stores/useStoriesStore";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";

interface CreateStoryOverlayProps {
  onClose: () => void;
}

/**
 * Full-screen story creation overlay: a `FormLayout` with a single markdown
 * TextArea. On publish, the story is created and added to the row immediately,
 * then the overlay closes.
 */
export function CreateStoryOverlay({ onClose }: CreateStoryOverlayProps) {
  const t = useTranslations("stories");
  const tCommon = useTranslations("common");
  const addStory = useStoriesStore((s) => s.addStory);
  const currentUser = useCurrentUserStore((s) => s.user);

  const [content, setContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const publish = async () => {
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
      addStory(story, {
        pseudo: currentUser.pseudo,
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
      });
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
      <Form
        type="longText"
        title={t("createTitle")}
        step={1}
        totalSteps={1}
        isCancelable
        onCancel={onClose}
        cancelLabel={tCommon("cancelButton")}
        placeholder={t("createPlaceholder")}
        rows={12}
        defaultValue=""
        onChange={(value) => setContent(value ?? "")}
        onPrimary={publish}
        primaryLabel={t("publish")}
        primaryLoading={isPublishing}
        error={error}
      />
    </motion.div>
  );
}
