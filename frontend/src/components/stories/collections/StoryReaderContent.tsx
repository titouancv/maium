"use client";

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
        <Markdown>{story.content}</Markdown>
      </motion.div>
    </AnimatePresence>
  );
}
