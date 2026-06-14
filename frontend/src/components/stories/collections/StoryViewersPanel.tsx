"use client";

import { useTranslations } from "next-intl";
import { Title } from "@/components/ui";
import type { StoryViewer } from "@/types/story";
import { StoryViewersList } from "./StoryViewersList";

interface StoryViewersPanelProps {
  viewers: StoryViewer[];
}

/**
 * Desktop-only inline counterpart of StoryViewersSheet: the viewers of the
 * current user's own story, rendered directly under the actions (no button, no
 * sheet). The viewers ship with the story (see `StoryData.viewers`), so the
 * list paints instantly with no extra fetch.
 */
export function StoryViewersPanel({ viewers }: StoryViewersPanelProps) {
  const t = useTranslations("stories");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Title
        size="h4"
        label={t("viewersCount", { count: viewers.length })}
        className="mb-2"
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <StoryViewersList viewers={viewers} />
      </div>
    </div>
  );
}
