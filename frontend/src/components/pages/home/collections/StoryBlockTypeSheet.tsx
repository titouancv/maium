"use client";

import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import type { StoryBlockType } from "@/types/story";
import { BlockIcon, CloseIcon } from "../storyBlockIcons";

const BLOCK_TYPES: StoryBlockType[] = ["heading", "text", "highlight", "bullet"];

const LABEL_KEY: Record<StoryBlockType, string> = {
  heading: "blockHeading",
  text: "blockText",
  highlight: "blockHighlight",
  bullet: "blockBullet",
};

const DESC_KEY: Record<StoryBlockType, string> = {
  heading: "blockHeadingDesc",
  text: "blockTextDesc",
  highlight: "blockHighlightDesc",
  bullet: "blockBulletDesc",
};

interface StoryBlockTypeSheetProps {
  open: boolean;
  showRemove: boolean;
  onSelect: (type: StoryBlockType) => void;
  onRemove: () => void;
  onClose: () => void;
}

/**
 * Bottom-sheet picker to append a block or change an existing block's type.
 * When editing an existing block (`showRemove`), it also offers to remove it.
 */
export function StoryBlockTypeSheet({
  open,
  showRemove,
  onSelect,
  onRemove,
  onClose,
}: StoryBlockTypeSheetProps) {
  const t = useTranslations("stories");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/30 md:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="bg-surface-50 border-brd-200 w-full max-w-xl rounded-t-3xl border-t p-4 md:rounded-3xl md:border"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-txt-muted mb-3 px-2 text-xs font-medium uppercase">
              {t("blockMenuTitle")}
            </p>
            <div className="flex flex-col gap-1">
              {BLOCK_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onSelect(type)}
                  className="hover:bg-surface-100 flex cursor-pointer items-center gap-3 rounded-2xl p-3 text-left transition-colors"
                >
                  <span className="bg-surface-200 text-txt flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                    <BlockIcon type={type} />
                  </span>
                  <span className="min-w-0">
                    <span className="text-txt block text-sm font-medium">
                      {t(LABEL_KEY[type])}
                    </span>
                    <span className="text-txt-muted block truncate text-xs">
                      {t(DESC_KEY[type])}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {showRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="text-error hover:bg-error/10 mt-1 flex w-full cursor-pointer items-center gap-3 rounded-2xl p-3 text-left text-sm font-medium transition-colors"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                  <CloseIcon />
                </span>
                {t("removeBlock")}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
