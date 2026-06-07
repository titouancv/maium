"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Conversation, Message } from "@/types";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { useConversationPreviewStore } from "@/stores/useConversationPreviewStore";
import { useConversationLastMessageStore } from "@/stores/useConversationLastMessageStore";
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
  const router = useRouter();
  // Hydrated at the layout level, so it is already set on client navigations.
  const currentUserId = useCurrentUserStore((s) => s.user?.id ?? "");
  const setPreviews = useConversationPreviewStore((s) => s.setPreviews);

  // Local copy so Realtime inserts can refresh previews/unread state without a
  // page reload. The server data stays authoritative: re-sync during render
  // whenever the prop changes so streamed/refetched data always wins.
  const [items, setItems] = useState<Conversation[]>(conversations);
  const [prevConversations, setPrevConversations] = useState(conversations);
  if (conversations !== prevConversations) {
    setPrevConversations(conversations);
    setItems(conversations);
  }

  // Seed the previews so opening any conversation can paint its header
  // instantly, before the conversation server round-trip resolves.
  useEffect(() => {
    setPreviews(items);
  }, [items, setPreviews]);

  // Messages sent/received while this route was unmounted (i.e. inside a
  // conversation) are mirrored here by MessageList. Fold them into the items so
  // the preview text and ordering are correct the instant we navigate back,
  // before the debounced server refresh below reconciles the cached RSC.
  const lastMessages = useConversationLastMessageStore((s) => s.lastMessages);
  const displayed = useMemo(() => {
    const merged = items.map((c) => {
      const override = lastMessages[c.id];
      if (
        override &&
        (!c.last_message || override.created_at > c.last_message.created_at)
      ) {
        return { ...c, last_message: override };
      }
      return c;
    });
    // Most recently active first (mirrors getConversations()).
    return merged.sort((a, b) => {
      const aDate = a.last_message?.created_at ?? a.created_at;
      const bDate = b.last_message?.created_at ?? b.created_at;
      return bDate.localeCompare(aDate);
    });
  }, [items, lastMessages]);

  // Keep the data the Realtime handler reads current without forcing the
  // subscription to tear down on every message update.
  const knownIdsRef = useRef<Set<string>>(
    new Set(conversations.map((c) => c.id)),
  );
  const activeIdRef = useRef(activeConversationId);
  const currentUserIdRef = useRef(currentUserId);
  const routerRef = useRef(router);
  useEffect(() => {
    knownIdsRef.current = new Set(items.map((c) => c.id));
    activeIdRef.current = activeConversationId;
    currentUserIdRef.current = currentUserId;
    routerRef.current = router;
  });
  // Trailing-debounced server refresh. The local setItems update below keeps the
  // list live instantly, but it's React state that's lost when the route
  // remounts from the Router Cache. Refreshing reconciles the cached RSC so the
  // correct last_message/read state survives navigating into a conversation and
  // back. Coalesced so a burst of messages triggers a single refresh.
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Realtime (option B): a single channel for the whole list. Every new message
  // is filtered client-side to the conversations we belong to, then bumps that
  // conversation's preview + unread state and re-sorts — so the list stays live
  // without a refresh.
  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        routerRef.current.refresh();
      }, 800);
    };

    const supabase = createClient();
    const channel: RealtimeChannel = supabase
      .channel("conversations-list")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          // A message in a conversation we don't know yet means we were just
          // added to a brand-new one. We lack its members locally, so let the
          // server recompute the list (last_message, sorting, filtering) and
          // stream the fresh prop back down. Debounced to avoid refresh storms.
          if (!knownIdsRef.current.has(msg.conversation_id)) {
            scheduleRefresh();
            return;
          }

          const isActive = msg.conversation_id === activeIdRef.current;
          const myId = currentUserIdRef.current;

          setItems((prev) => {
            const next = prev.map((c) => {
              if (c.id !== msg.conversation_id) return c;
              // If the message lands in the conversation we're already viewing,
              // advance our own read marker so it doesn't flash as unread.
              const members =
                isActive && myId
                  ? c.members.map((m) =>
                      m.id === myId
                        ? { ...m, last_read_at: msg.created_at }
                        : m,
                    )
                  : c.members;
              return {
                ...c,
                members,
                last_message: {
                  content: msg.content,
                  created_at: msg.created_at,
                  sender_id: msg.sender_id,
                },
              };
            });
            // Most recently active first (mirrors getConversations()).
            return next.sort((a, b) => {
              const aDate = a.last_message?.created_at ?? a.created_at;
              const bDate = b.last_message?.created_at ?? b.created_at;
              return bDate.localeCompare(aDate);
            });
          });

          // Reconcile the cached server data so the update outlives a remount.
          scheduleRefresh();
        },
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  if (displayed.length === 0) {
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
      {displayed.map((c) => (
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
