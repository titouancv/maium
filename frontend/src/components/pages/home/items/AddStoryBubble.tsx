"use client";

import { Button } from "@/components/ui";
import { useTranslations } from "next-intl";

interface AddStoryBubbleProps {
  onClick: () => void;
}

/** The leading "+" card of the stories row that opens the creation overlay. */
export function AddStoryBubble({ onClick }: AddStoryBubbleProps) {
  const t = useTranslations("stories");

  return (
    <Button
      variant="primary"
      size="sm"
      className="w-full"
      onClick={onClick}
      aria-label={t("addStory")}
    >
      <span>{t("addStory")}</span>
    </Button>
  );
}
