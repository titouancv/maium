"use client";

import { useTranslations } from "next-intl";
import { ProfilePhoto } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { StoryGroup } from "@/types/story";
import { AddStoryBubble } from "./AddStoryBubble";

interface StoryBubbleProps {
  group: StoryGroup;
  onOpen: () => void;
  onAddStory?: () => void;
  isEmptyOwner?: boolean;
  /** Override the bubble width (defaults to the home row's fixed `w-44`). */
  className?: string;
  /** Hide the name overlay (e.g. desktop profile, where @pseudo shows below). */
  hideName?: boolean;
}

export function StoryBubble({
  group,
  onOpen,
  onAddStory,
  isEmptyOwner,
  className,
  hideName,
}: StoryBubbleProps) {
  const t = useTranslations("stories");
  const { author, hasUnseen } = group;

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={isEmptyOwner ? onAddStory : onOpen}
        aria-label={
          isEmptyOwner
            ? t("addStory")
            : t("openStories", { name: author.first_name })
        }
        className={cn(
          "hover:text-primary relative flex w-44 min-w-0 shrink-0 cursor-pointer flex-col gap-2",
          className,
        )}
      >
        <ProfilePhoto
          pseudo={author.pseudo}
          src={author.profile_photo}
          displayName={
            hideName
              ? undefined
              : { firstName: author.first_name, lastName: author.last_name }
          }
          isFramed={!isEmptyOwner}
          isFrameMuted={!hasUnseen}
        />
      </button>
      {onAddStory && <AddStoryBubble onClick={onAddStory} />}
    </div>
  );
}
