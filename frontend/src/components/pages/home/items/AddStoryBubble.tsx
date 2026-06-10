"use client";

import { useTranslations } from "next-intl";

interface AddStoryBubbleProps {
  onClick: () => void;
}

/** The leading "+" bubble of the stories row that opens the creation overlay. */
export function AddStoryBubble({ onClick }: AddStoryBubbleProps) {
  const t = useTranslations("stories");

  return (
    <button
      onClick={onClick}
      aria-label={t("addStory")}
      className="group flex w-16 shrink-0 cursor-pointer flex-col items-center gap-1"
    >
      <span className="border-brd-200 text-txt-muted group-hover:border-primary group-hover:text-primary group-active:scale-95 flex aspect-[5/7] w-[56px] items-center justify-center rounded-md border-2 border-dashed transition-all">
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
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </span>
      <span className="text-txt-muted w-full truncate text-center text-xs">
        {t("addStory")}
      </span>
    </button>
  );
}
