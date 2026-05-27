"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { API } from "@/constants";
import type { Message, OptimisticMessage } from "@/types";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
  isGroup: boolean;
}

export function MessageList({
  conversationId,
  initialMessages,
  currentUserId,
  isGroup,
}: MessageListProps) {
  const t = useTranslations("messaging");
  const [messages, setMessages] = useState<OptimisticMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on mount and new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Realtime subscription for new messages
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
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;

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
    setSending(true);

    try {
      const res = await fetch(API.MESSAGES_CONVERSATION_MESSAGES(conversationId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

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
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Message list */}
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-txt-muted text-sm">{t("emptyConversation")}</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const prev = messages[i - 1];
            const showSender =
              isGroup &&
              msg.sender_id !== currentUserId &&
              prev?.sender_id !== msg.sender_id;
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_id === currentUserId}
                showSender={showSender}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-surface-200 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("messageInputPlaceholder")}
            rows={1}
            className="text-txt placeholder:text-txt-muted bg-surface-100 focus:bg-surface-200 flex-1 resize-none rounded-2xl px-4 py-3 text-sm outline-none transition-colors"
            style={{ maxHeight: "120px", overflowY: "auto" }}
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="bg-primary text-on-primary disabled:opacity-40 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-opacity active:scale-95"
            aria-label={t("sendButton")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22 11 13 2 9l20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
