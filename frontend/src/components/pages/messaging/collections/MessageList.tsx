"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  API,
  MESSAGES_PAGE_SIZE,
  MESSAGE_GROUP_WINDOW_MS,
  TYPING_BROADCAST_THROTTLE_MS,
  TYPING_INDICATOR_TIMEOUT_MS,
} from "@/constants";
import { formatLongDate, isSameDay } from "@/lib/date";
import { usePresenceStore } from "@/stores/usePresenceStore";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { useMessagingStore } from "@/stores/useMessagingStore";
import type { ConversationMember, Message, OptimisticMessage } from "@/types";
import { MessageBubble } from "../items/MessageBubble";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-6 pb-2">
      <div className="border-border h-px flex-1 border-t" />
      <p className="text-txt-muted text-xs">{label}</p>
      <div className="border-border h-px flex-1 border-t" />
    </div>
  );
}

interface MessageListProps {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
  otherUserId: string | null;
  otherMember: ConversationMember | null;
  otherLastReadAt: string | null;
}

export function MessageList({
  conversationId,
  initialMessages,
  currentUserId,
  otherUserId,
  otherMember,
  otherLastReadAt,
}: MessageListProps) {
  const t = useTranslations("messaging");
  const locale = useLocale();
  const [messages, setMessages] =
    useState<OptimisticMessage[]>(initialMessages);
  const [hasMore, setHasMore] = useState(
    initialMessages.length === MESSAGES_PAGE_SIZE,
  );
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [otherReadAt, setOtherReadAt] = useState<string | null>(
    otherLastReadAt,
  );
  const currentUser = useCurrentUserStore((s) => s.user);
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);
  const isOtherOnline = otherUserId ? onlineUserIds.has(otherUserId) : false;

  const formatDateLabel = (dateStr: string): string => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    if (isSameDay(dateStr, now.toISOString())) return t("today");
    if (isSameDay(dateStr, yesterday.toISOString())) return t("yesterday");

    return formatLongDate(dateStr, locale);
  };
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);
  // Guards against concurrent older-page fetches.
  const loadingOlderRef = useRef(false);
  // scrollHeight captured just before prepending an older page, so we can keep
  // the viewport anchored on the same message after the DOM grows upward.
  const prependPrevHeightRef = useRef<number | null>(null);
  // Last appended (bottom) message id — used to auto-scroll only on new
  // incoming/sent messages, never when older messages are prepended on top.
  const lastBottomIdRef = useRef<string | undefined>(undefined);
  // The first paint must jump straight to the bottom (no animation); later
  // messages animate in smoothly.
  const didInitialScrollRef = useRef(false);

  // Persist our read position and tell the other member instantly (broadcast).
  const markRead = useCallback(() => {
    const readAt = new Date().toISOString();
    fetch(API.MESSAGES_CONVERSATION_READ(conversationId), {
      method: "PATCH",
    }).catch(() => {});
    // Mirror it into the shared store so the conversations list — a separate,
    // Router-cached route — drops the unread marker as soon as we come back,
    // without waiting on a server refresh.
    useMessagingStore.getState().markRead(conversationId, readAt);
    channelRef.current?.send({
      type: "broadcast",
      event: "read",
      payload: { userId: currentUserId, read_at: readAt },
    });
  }, [conversationId, currentUserId]);

  // Keep input above the keyboard on mobile by tracking visual viewport height.
  // We must also pin the page scroll to the top: when the keyboard opens, iOS
  // scrolls the layout viewport up by the keyboard height, which — on top of the
  // shrunk container — pushes the input twice too high. Anchoring scroll to 0
  // (and reacting to viewport scroll, not just resize) keeps it just above the
  // keyboard.
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateHeight = () => {
      if (!containerRef.current) return;
      const keyboardOpen = viewport.height < window.innerHeight * 0.9;
      if (keyboardOpen) {
        window.scrollTo(0, 0);
        containerRef.current.style.height = `${viewport.height}px`;
        bottomRef.current?.scrollIntoView({ behavior: "instant" });
      } else {
        containerRef.current.style.height = "";
      }
    };

    viewport.addEventListener("resize", updateHeight);
    viewport.addEventListener("scroll", updateHeight);
    return () => {
      viewport.removeEventListener("resize", updateHeight);
      viewport.removeEventListener("scroll", updateHeight);
    };
  }, []);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!input && textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
    }
  }, [input]);

  // Auto-scroll to the bottom only when a new message lands at the bottom
  // (mount, sent, or received) — not when an older page is prepended on top.
  // The first paint jumps instantly (before the browser paints, via layout
  // effect) so the conversation opens pinned to the latest message; subsequent
  // messages animate smoothly.
  useLayoutEffect(() => {
    const bottomId = messages[messages.length - 1]?.id;
    if (!bottomId || bottomId === lastBottomIdRef.current) return;
    lastBottomIdRef.current = bottomId;
    bottomRef.current?.scrollIntoView({
      behavior: didInitialScrollRef.current ? "smooth" : "instant",
    });
    didInitialScrollRef.current = true;
  }, [messages]);

  // After an older page is prepended, restore the scroll position so the
  // viewport stays anchored on the message the user was looking at.
  useLayoutEffect(() => {
    const prevHeight = prependPrevHeightRef.current;
    if (prevHeight == null || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight - prevHeight;
    prependPrevHeightRef.current = null;
  }, [messages]);

  // Fetch the previous page of messages when the user scrolls near the top.
  const loadOlder = useCallback(async () => {
    if (loadingOlderRef.current || !hasMore) return;
    const oldest = messages[0];
    if (!oldest) return;

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const res = await fetch(
        `${API.MESSAGES_CONVERSATION_MESSAGES(conversationId)}?before=${encodeURIComponent(
          oldest.created_at,
        )}`,
      );
      if (!res.ok) return;
      const { messages: older, hasMore: more } = (await res.json()) as {
        messages: Message[];
        hasMore: boolean;
      };
      if (older.length > 0 && listRef.current) {
        prependPrevHeightRef.current = listRef.current.scrollHeight;
        setMessages((prev) => {
          const known = new Set(prev.map((m) => m.id));
          const fresh = older.filter((m) => !known.has(m.id));
          return [...fresh, ...prev];
        });
      }
      setHasMore(more);
    } catch {
      // Keep hasMore true so a later scroll can retry.
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [conversationId, hasMore, messages]);

  const handleScroll = useCallback(() => {
    const list = listRef.current;
    if (list && list.scrollTop < 100) loadOlder();
  }, [loadOlder]);

  // The initial messages come from the streamed server data, which may be
  // served from the Router Cache and miss messages that arrived (e.g. shown by
  // the conversations list's Realtime) after this route was prefetched.
  // Realtime only delivers messages from subscribe-time forward, so fetch the
  // latest page once on mount and merge anything we don't already have.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          API.MESSAGES_CONVERSATION_MESSAGES(conversationId),
        );
        if (!res.ok) return;
        const { messages: latest } = (await res.json()) as {
          messages: Message[];
          hasMore: boolean;
        };
        if (cancelled || latest.length === 0) return;
        setMessages((prev) => {
          const known = new Set(prev.map((m) => m.id));
          const missing = latest.filter((m) => !known.has(m.id));
          if (missing.length === 0) return prev;
          return [...prev, ...missing].sort((a, b) =>
            a.created_at.localeCompare(b.created_at),
          );
        });
      } catch {
        // Best-effort reconcile; Realtime still covers messages from here on.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  // Realtime: new messages (postgres_changes) + typing & read (broadcast).
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Skip if it's our own optimistic message (will be replaced)
          if (newMsg.sender_id === currentUserId) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            // The Realtime payload carries only the row columns, not the joined
            // sender. Reuse the sender from an existing message by the same
            // author (covers groups), falling back to the known other member —
            // otherwise the name never renders on live-received messages.
            const sender =
              prev.find((m) => m.sender_id === newMsg.sender_id && m.sender)
                ?.sender ??
              (otherMember?.id === newMsg.sender_id
                ? {
                    pseudo: otherMember.pseudo,
                    first_name: otherMember.first_name,
                    last_name: otherMember.last_name,
                  }
                : null);
            return [...prev, { ...newMsg, sender }];
          });
          // The list's preview/order/unread state is kept live by the
          // layout-level Realtime subscription (MessagingRealtime), so here we
          // only mark the open conversation read while it's visible.
          if (document.visibilityState === "visible") markRead();
        },
      )
      .on(
        "broadcast",
        { event: "typing" },
        ({ payload }: { payload: { userId: string } }) => {
          if (payload.userId === currentUserId) return;
          setTypingUserId(payload.userId);
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(
            () => setTypingUserId(null),
            TYPING_INDICATOR_TIMEOUT_MS,
          );
        },
      )
      .on(
        "broadcast",
        { event: "read" },
        ({ payload }: { payload: { userId: string; read_at: string } }) => {
          if (payload.userId === currentUserId) return;
          setOtherReadAt((prev) =>
            !prev || payload.read_at > prev ? payload.read_at : prev,
          );
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") markRead();
      });

    channelRef.current = channel;

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, currentUserId, markRead, otherMember]);

  // Mark read again when the tab/window regains focus while open.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") markRead();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [markRead]);

  const sendTyping = () => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_BROADCAST_THROTTLE_MS) return;
    lastTypingSentRef.current = now;
    channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId },
    });
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content) return;

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg: OptimisticMessage = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
      edited_at: null,
      deleted_at: null,
      sender: currentUser
        ? {
            pseudo: currentUser.pseudo,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
          }
        : null,
      optimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");

    try {
      const res = await fetch(
        API.MESSAGES_CONVERSATION_MESSAGES(conversationId),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        },
      );

      if (!res.ok) throw new Error("Send failed");

      const { message } = await res.json();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticId ? { ...message, optimistic: false } : m,
        ),
      );
      // Bump the shared store so the list reflects this send instantly. The
      // layout Realtime subscription would also catch it, but with round-trip
      // latency; this keeps the list correct the moment we navigate back.
      useMessagingStore.getState().applyMessage(conversationId, {
        content: message.content,
        created_at: message.created_at,
        sender_id: message.sender_id,
      });
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInput(content);
    } finally {
      textAreaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groupFirsts: OptimisticMessage[] = [];
  for (let i = 0; i < messages.length; i++) {
    if (i === 0) {
      groupFirsts.push(messages[i]);
      continue;
    }
    const prev = messages[i - 1];
    const prevFirst = groupFirsts[i - 1];
    const grouped =
      isSameDay(prev.created_at, messages[i].created_at) &&
      prevFirst.sender_id === messages[i].sender_id &&
      new Date(messages[i].created_at).getTime() -
        new Date(prevFirst.created_at).getTime() <
        MESSAGE_GROUP_WINDOW_MS;
    groupFirsts.push(grouped ? prevFirst : messages[i]);
  }

  // Index of the last message we sent that the other member has read → "Seen".
  let lastSeenIndex = -1;
  if (otherReadAt) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (
        m.sender_id === currentUserId &&
        !m.optimistic &&
        m.created_at <= otherReadAt
      ) {
        lastSeenIndex = i;
        break;
      }
    }
  }

  const statusLabel = typingUserId
    ? t("typing")
    : isOtherOnline
      ? t("online")
      : null;

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full flex-col overflow-hidden"
    >
      {/* Online / typing status */}
      <div className="text-txt-muted flex h-5 w-full shrink-0 items-center justify-center pt-2 pb-4 text-sm font-extrabold">
        <div>{statusLabel && <>{statusLabel}</>}</div>
      </div>

      {/* Message list */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pt-4 pb-12"
      >
        {loadingOlder && (
          <div className="flex justify-center py-2">
            <div className="border-txt-muted h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-txt-muted text-sm">{t("emptyConversation")}</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const prev = index > 0 ? messages[index - 1] : null;
            const showSeparator =
              !prev || !isSameDay(prev.created_at, msg.created_at);
            const isGrouped = groupFirsts[index] !== msg;
            return (
              <Fragment key={msg.id}>
                {showSeparator && (
                  <DateSeparator label={formatDateLabel(msg.created_at)} />
                )}
                <MessageBubble
                  message={msg}
                  isOwn={msg.sender_id === currentUserId}
                  showSender={!isGrouped}
                  locale={locale}
                />
                {index === lastSeenIndex && index === messages.length - 1 && (
                  <p className="text-txt-muted pt-1 text-left text-xs">
                    {t("seen")}
                  </p>
                )}
              </Fragment>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 pt-2 pb-8">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <TextArea
              ref={textAreaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                sendTyping();
                const el = e.target;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
              enterKeyHint="send"
              onKeyDown={handleKeyDown}
              placeholder={t("messageInputPlaceholder")}
              row={1}
              style={{ maxHeight: "120px", overflowY: "auto" }}
              className="py-2"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            variant="primary"
            size="sm"
            aria-label={t("sendButton")}
            className="hidden md:inline-flex"
          >
            {t("sendButton")}
          </Button>
        </div>
      </div>
    </div>
  );
}
