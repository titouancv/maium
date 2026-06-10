"use client";

import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ProfilePhoto, RollingText } from "@/components/ui";
import type { UserSummary } from "@/types/user";

interface StoryReaderHeaderProps {
  author: UserSummary;
  /** Stable id (author id) so the name/photo roll when the author changes. */
  authorId: string;
  onClose: () => void;
}

/**
 * Reader header: avatar + author name on the left (both "roll" vertically when
 * switching to another author, inspired by NumberRoller), close button right.
 */
export function StoryReaderHeader({
  author,
  authorId,
  onClose,
}: StoryReaderHeaderProps) {
  const t = useTranslations("stories");

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="relative block h-10 w-8 shrink-0 overflow-hidden rounded">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={authorId}
              initial={{ y: "110%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-110%", opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="block"
            >
              <ProfilePhoto
                pseudo={author.pseudo}
                hideGradient
                sizes="32px"
                className="w-8 rounded"
              />
            </motion.span>
          </AnimatePresence>
        </span>

        <div className="flex min-w-0 flex-col">
          <RollingText
            value={`${author.first_name} ${author.last_name}`}
            rollKey={authorId}
            className="text-txt h-6 max-w-[60vw] text-sm font-medium"
          />
          <span className="text-txt-muted truncate text-xs">
            @{author.pseudo}
          </span>
        </div>
      </div>

      <button
        onClick={onClose}
        aria-label={t("close")}
        className="text-txt hover:text-primary active:scale-95 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
