"use client";

import { useTranslations } from "next-intl";
import { Title } from "@/components/ui";
import { StoryViewersList, useStoryViewers } from "./StoryViewersList";

interface StoryViewersPanelProps {
  storyId: string;
}

/**
 * Desktop-only inline counterpart of StoryViewersSheet: the viewers of the
 * current user's own story, rendered directly under the actions (no button, no
 * sheet). Mounted only on desktop by the reader, so the fetch never fires on
 * mobile where the sheet handles it instead.
 */
export function StoryViewersPanel({ storyId }: StoryViewersPanelProps) {
  const t = useTranslations("stories");
  const viewers = useStoryViewers(storyId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Title
        size="h4"
        label={
          viewers
            ? t("viewersCount", { count: viewers.length })
            : t("viewersTitle")
        }
        className="mb-2"
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <StoryViewersList viewers={viewers} />
      </div>
    </div>
  );
}
