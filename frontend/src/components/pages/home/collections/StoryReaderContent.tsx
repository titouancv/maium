"use client";

import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Markdown } from "@/components/ui";
import type { StoryData } from "@/types/story";

interface StoryReaderContentProps {
  story: StoryData;
}

/**
 * Scrollable markdown body of a story. Each story change cross-fades (fade-out
 * then fade-in, via `mode="wait"`) and remounts at the top, keyed by story id
 * so navigating forward/back/across authors never re-renders abruptly.
 */
export function StoryReaderContent({ story }: StoryReaderContentProps) {
  const t = useTranslations("stories");

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={story.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="h-full overflow-y-auto"
      >
        {story.isRepost && story.originalAuthorPseudo ? (
          <div className="border-brd-200 text-txt-muted mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs">
            <svg
              width="13"
              height="13"
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
            {t("repostFrom", { pseudo: story.originalAuthorPseudo })}
          </div>
        ) : null}

        <Markdown>{story.content}</Markdown>
      </motion.div>
    </AnimatePresence>
  );
}
