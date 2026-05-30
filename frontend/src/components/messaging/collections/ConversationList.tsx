"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import type { Conversation } from "@/types";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { useConversationPreviewStore } from "@/stores/useConversationPreviewStore";
import { ConversationItem } from "../items/ConversationItem";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
}

export function ConversationList({
  conversations,
  activeConversationId,
}: ConversationListProps) {
  const t = useTranslations("messaging");
  // Hydrated at the layout level, so it is already set on client navigations.
  const currentUserId = useCurrentUserStore((s) => s.user?.id ?? "");
  const setPreviews = useConversationPreviewStore((s) => s.setPreviews);

  // Seed the previews so opening any conversation can paint its header
  // instantly, before the conversation server round-trip resolves.
  useEffect(() => {
    setPreviews(conversations);
  }, [conversations, setPreviews]);

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-12">
        <p className="text-txt text-sm font-medium">{t("noConversations")}</p>
        <p className="text-txt-muted text-center text-xs">
          {t("noConversationsHint")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {conversations.map((c) => (
        <ConversationItem
          key={c.id}
          conversation={c}
          currentUserId={currentUserId}
          active={c.id === activeConversationId}
        />
      ))}
    </div>
  );
}
