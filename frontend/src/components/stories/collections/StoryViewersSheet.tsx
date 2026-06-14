"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Title, Button } from "@/components/ui";
import type { StoryViewer } from "@/types/story";
import { StoryViewersList } from "./StoryViewersList";

interface StoryViewersSheetProps {
  viewers: StoryViewer[];
  onClose: () => void;
}

/**
 * Bottom sheet listing the users who have viewed one of the current user's own
 * stories. The viewers ship with the story (see `StoryData.viewers`), so the
 * list paints instantly with no extra fetch. Used on mobile; on desktop the
 * list is shown inline (see StoryViewersPanel).
 */
export function StoryViewersSheet({ viewers, onClose }: StoryViewersSheetProps) {
  const t = useTranslations("stories");
  const tCommon = useTranslations("common");

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <button
        type="button"
        aria-label={t("close")}
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="bg-surface-50 relative flex max-h-[70vh] w-full max-w-7xl flex-col rounded-t-md px-4 pt-3 pb-8"
      >
        <div className="mb-2 flex items-center justify-between">
          <Title size="h4" label={t("viewersCount", { count: viewers.length })} />
          <Button variant="ghost" size="none" onClick={onClose} className="p-1">
            {tCommon("backButton")}
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <StoryViewersList viewers={viewers} />
        </div>
      </motion.div>
    </div>
  );
}
