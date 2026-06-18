"use client";

import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { usePathname } from "@/i18n/navigation";
import { API, CONVERSATIONS_REFETCH_DEBOUNCE_MS } from "@/constants";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { useMessagingStore } from "@/stores/useMessagingStore";
import { activeConversationIdFrom } from "@/lib/messaging/conversationPath";
import type { Conversation, Message } from "@/types";

/**
 * A single Realtime subscription for the whole messaging area, mounted in the
 * messaging layout so it survives navigation between the list and a
 * conversation (a per-route subscription would tear down and miss messages).
 *
 * Every new message updates [useMessagingStore]: known conversations get their
 * preview/order/read state bumped in place; a message in an unknown
 * conversation means we were just added to a new one, so we refetch the list.
 */
export function MessagingRealtime() {
  const userId = useCurrentUserStore((s) => s.user?.id);
  const pathname = usePathname();

  // Read inside the Realtime callback without re-subscribing on every change.
  const activeIdRef = useRef<string | undefined>(undefined);
  const userIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    activeIdRef.current = activeConversationIdFrom(pathname);
    userIdRef.current = userId;
  });

  useEffect(() => {
    if (!userId) return;

    const refetchTimer = { current: null as ReturnType<typeof setTimeout> | null };
    const scheduleRefetch = () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      refetchTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(API.MESSAGES_CONVERSATIONS);
          if (!res.ok) return;
          const { conversations } = (await res.json()) as {
            conversations: Conversation[];
          };
          useMessagingStore.getState().hydrate(conversations);
        } catch {
          // Best-effort; the next message or a navigation will reconcile.
        }
      }, CONVERSATIONS_REFETCH_DEBOUNCE_MS);
    };

    const supabase = createClient();
    const channel: RealtimeChannel = supabase
      .channel("messaging:list")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          const known = useMessagingStore
            .getState()
            .conversations.some((c) => c.id === msg.conversation_id);

          if (!known) {
            scheduleRefetch();
            return;
          }

          useMessagingStore.getState().applyMessage(
            msg.conversation_id,
            {
              content: msg.content,
              created_at: msg.created_at,
              sender_id: msg.sender_id,
            },
            {
              activeConversationId: activeIdRef.current,
              currentUserId: userIdRef.current,
            },
          );
        },
      )
      .subscribe();

    return () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return null;
}
