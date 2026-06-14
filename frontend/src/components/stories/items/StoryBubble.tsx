"use client";

import { useTranslations } from "next-intl";
import { ProfilePhoto } from "@/components/ui";
import type { StoryGroup } from "@/types/story";
import { AddStoryBubble } from "./AddStoryBubble";

interface StoryBubbleProps {
  group: StoryGroup;
  onOpen: () => void;
  onAddStory?: () => void;
  isEmptyOwner?: boolean;
}

export function StoryBubble({
  group,
  onOpen,
  onAddStory,
  isEmptyOwner,
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
        className="hover:text-primary relative flex w-44 min-w-0 shrink-0 cursor-pointer flex-col gap-2"
      >
        <ProfilePhoto
          pseudo={author.pseudo}
          displayName={{
            firstName: author.first_name,
            lastName: author.last_name,
          }}
          isFramed={!isEmptyOwner}
          isFrameMuted={!hasUnseen}
        />
      </button>
      {onAddStory && <AddStoryBubble onClick={onAddStory} />}
    </div>
  );
}
