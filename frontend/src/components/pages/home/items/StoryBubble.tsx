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
          isFramed={hasUnseen}
          className={isEmptyOwner ? "opacity-50" : undefined}
        />

        {/* Author name, sitting on the photo's bottom surface fade */}
        <div className="flex flex-col text-left">
          <p className="truncate leading-none">{author.first_name}</p>
          <p className="-mt-0.5 ml-2 truncate text-xl leading-none font-extrabold">
            {author.last_name}
          </p>
        </div>
      </button>
      {onAddStory && <AddStoryBubble onClick={onAddStory} />}
    </div>
  );
}
