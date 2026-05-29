"use client";

import { useTranslations } from "next-intl";
import type { Conversation } from "@/types";
import { ConversationItem } from "./ConversationItem";

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId: string;
  activeConversationId?: string;
}

export function ConversationList({
  conversations,
  currentUserId,
  activeConversationId,
}: ConversationListProps) {
  const t = useTranslations("messaging");

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
    <div className="flex flex-col gap-1 px-2">
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
