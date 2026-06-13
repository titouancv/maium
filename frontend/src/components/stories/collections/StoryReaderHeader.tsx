"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Button, UserCard } from "@/components/ui";
import { formatRelativeTime } from "@/lib/date";
import type { UserSummary } from "@/types/user";

interface StoryReaderHeaderProps {
  author: UserSummary;
  /** Stable id (author id) so the card rolls when the author changes. */
  authorId: string;
  /** Publish time of this story (repost time for reposts), epoch ms. */
  createdAt: number;
  /** Whether this entry is a repost (shows a « republié par @… » marker). */
  isRepost: boolean;
  /** Pseudo of the user who reposted (the group author), for the repost marker. */
  reposterPseudo?: string | null;
  onClose: () => void;
}

/**
 * Reader header: author card on the left (rolls vertically as a block when
 * switching to another author, inspired by NumberRoller), close button right.
 * The card's subtitle carries the relative publish time and, for reposts, a
 * « republié » marker.
 */
export function StoryReaderHeader({
  author,
  authorId,
  createdAt,
  isRepost,
  reposterPseudo,
  onClose,
}: StoryReaderHeaderProps) {
  const tCommon = useTranslations("common");
  const tStories = useTranslations("stories");
  const locale = useLocale();

  const relative = formatRelativeTime(createdAt, locale);
  const subtitle =
    isRepost && reposterPseudo
      ? `@${author.pseudo} • ${tStories("repostedBy", { pseudo: reposterPseudo })} • ${relative}`
      : `@${author.pseudo} • ${relative}`;

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
              subtitle={subtitle}
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
