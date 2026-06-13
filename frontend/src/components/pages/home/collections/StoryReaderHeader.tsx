"use client";

import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Button, UserCard } from "@/components/ui";
import type { UserSummary } from "@/types/user";

interface StoryReaderHeaderProps {
  author: UserSummary;
  /** Stable id (author id) so the card rolls when the author changes. */
  authorId: string;
  onClose: () => void;
}

/**
 * Reader header: author card on the left (rolls vertically as a block when
 * switching to another author, inspired by NumberRoller), close button right.
 */
export function StoryReaderHeader({
  author,
  authorId,
  onClose,
}: StoryReaderHeaderProps) {
  const tCommon = useTranslations("common");

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="relative block min-w-0 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={authorId}
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-110%", opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="block"
          >
            <UserCard
              pseudo={author.pseudo}
              first_name={author.first_name}
              last_name={author.last_name}
            />
          </motion.span>
        </AnimatePresence>
      </span>

      <Button variant="ghost" size="none" onClick={onClose} className="p-1">
        {tCommon("backButton")}
      </Button>
    </div>
  );
}
