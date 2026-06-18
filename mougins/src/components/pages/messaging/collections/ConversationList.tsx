"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import type { Conversation } from "@/types";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { useMessagingStore } from "@/stores/useMessagingStore";
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
  const hydrate = useMessagingStore((s) => s.hydrate);
  const stored = useMessagingStore((s) => s.conversations);

  // Reconcile the streamed (authoritative) server data into the shared store.
  // The single Realtime subscription in the messaging layout keeps that store
  // live across navigation, so this component needs neither its own
  // subscription nor a router.refresh to stay current — it just renders the
  // store and lets `hydrate` merge in fresh server data.
  useEffect(() => {
    hydrate(conversations);
  }, [conversations, hydrate]);

  // Use the store once hydrated; fall back to the freshly streamed prop on the
  // first paint so the list never flashes empty.
  const items = stored.length > 0 ? stored : conversations;

  if (items.length === 0) {
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
