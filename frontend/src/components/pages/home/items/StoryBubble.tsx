"use client";

import { useTranslations } from "next-intl";
import { ProfilePhoto } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { StoryGroup } from "@/types/story";

interface StoryBubbleProps {
  group: StoryGroup;
  onOpen: () => void;
}

/**
 * One author's story bubble in the home stories row. A `primary` ring (and a
 * hidden bottom gradient) signals unseen stories; once everything is seen, the
 * avatar shows with no special border.
 */
export function StoryBubble({ group, onOpen }: StoryBubbleProps) {
  const t = useTranslations("stories");
  const { author, hasUnseen } = group;

  return (
    <button
      onClick={onOpen}
      aria-label={t("openStories", { name: author.first_name })}
      className="group flex w-16 shrink-0 cursor-pointer flex-col items-center gap-1"
    >
      <span
        className={cn(
          "block rounded-md p-[2px]",
          hasUnseen ? "ring-primary ring-2" : "ring-brd-200 ring-1",
        )}
      >
        <ProfilePhoto
          pseudo={author.pseudo}
          hideGradient={hasUnseen}
          sizes="56px"
          className="group-active:scale-95 w-[52px] rounded transition-transform"
        />
      </span>
      <span className="text-txt-muted w-full truncate text-center text-xs">
        {author.first_name}
      </span>
    </button>
  );
}
