"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { API } from "@/constants";
import { UserCard, Skeleton, Title, Button } from "@/components/ui";
import type { UserSummary } from "@/types/user";

interface StoryViewersSheetProps {
  storyId: string;
  onClose: () => void;
}

/**
 * Bottom sheet listing the users who have viewed one of the current user's own
 * stories. Fetched lazily on open; only the author is authorised server-side.
 */
export function StoryViewersSheet({
  storyId,
  onClose,
}: StoryViewersSheetProps) {
  const t = useTranslations("stories");
  const tCommon = useTranslations("common");
  const [viewers, setViewers] = useState<UserSummary[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch(API.STORY_VIEWERS(storyId))
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => {
        if (active) setViewers(data.users ?? []);
      })
      .catch(() => {
        if (active) setViewers([]);
      });
    return () => {
      active = false;
    };
  }, [storyId]);

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
        className="bg-surface-50 relative flex max-h-[70vh] w-full max-w-md flex-col rounded-t-md px-4 pt-3 pb-8"
      >
        <div className="mb-2 flex items-center justify-between">
          <Title
            size="h4"
            label={
              viewers
                ? t("viewersCount", { count: viewers.length })
                : t("viewersTitle")
            }
          />
          <Button variant="ghost" size="none" onClick={onClose} className="p-1">
            {tCommon("backButton")}
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {viewers === null ? (
            <div className="flex flex-col gap-3 py-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-sm" />
              ))}
            </div>
          ) : viewers.length === 0 ? (
            <p className="text-txt-muted py-8 text-center text-sm">
              {t("noViewers")}
            </p>
          ) : (
            <ul>
              {viewers.map((viewer) => (
                <li key={viewer.pseudo}>
                  <UserCard {...viewer} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}
