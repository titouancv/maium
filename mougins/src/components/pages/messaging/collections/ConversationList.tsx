"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import type { Conversation } from "@/types";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { useMessagingStore } from "@/stores/useMessagingStore";
import { Text } from "@/components/ui/Text";
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
  const currentUserId = useCurrentUserStore((s) => s.user?.id ?? "");
  const hydrate = useMessagingStore((s) => s.hydrate);
  const stored = useMessagingStore((s) => s.conversations);

  useEffect(() => {
    hydrate(conversations);
  }, [conversations, hydrate]);

  const items = stored.length > 0 ? stored : conversations;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-12">
        <Text size="sm" className="font-medium">
          {t("noConversations")}
        </Text>
        <Text tone="muted" size="xs" className="text-center">
          {t("noConversationsHint")}
        </Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((c) => (
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
