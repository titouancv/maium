"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { API } from "@/constants";
import { formatLongDate, isSameDay } from "@/lib/date";
import { usePresenceStore } from "@/stores/usePresenceStore";
import type { Message, OptimisticMessage } from "@/types";
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
  isGroup: boolean;
  otherUserId: string | null;
  otherLastReadAt: string | null;
}

export function MessageList({
  conversationId,
  initialMessages,
  currentUserId,
  otherUserId,
  otherLastReadAt,
}: MessageListProps) {
  const t = useTranslations("messaging");
  const locale = useLocale();
  const [messages, setMessages] =
    useState<OptimisticMessage[]>(initialMessages);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [otherReadAt, setOtherReadAt] = useState<string | null>(
    otherLastReadAt,
  );
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

  // Persist our read position and tell the other member instantly (broadcast).
  const markRead = useCallback(() => {
    fetch(API.MESSAGES_CONVERSATION_READ(conversationId), {
      method: "PATCH",
    }).catch(() => {});
    channelRef.current?.send({
      type: "broadcast",
      event: "read",
      payload: { userId: currentUserId, read_at: new Date().toISOString() },
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

  // Scroll to bottom on mount and new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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
            return [...prev, { ...newMsg, sender: null }];
          });
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
            3000,
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
  }, [conversationId, currentUserId, markRead]);

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
    if (now - lastTypingSentRef.current < 2000) return;
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
      sender: null,
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
        5 * 60 * 1000;
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
      <div className="text-primary flex h-5 shrink-0 items-center gap-1.5 text-xs">
        {statusLabel && <>{statusLabel}</>}
      </div>

      {/* Message list */}
      <div ref={listRef} className="flex-1 overflow-y-auto py-4">
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
                {index === lastSeenIndex && (
                  <p className="text-txt-muted pt-1 text-right text-xs">
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
