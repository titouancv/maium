"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { API } from "@/constants";
import type { Message, OptimisticMessage } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";

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
}: MessageListProps) {
  const t = useTranslations("messaging");
  const [messages, setMessages] =
    useState<OptimisticMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep input above the keyboard on mobile by tracking visual viewport height
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateHeight = () => {
      if (!containerRef.current) return;
      const keyboardOpen = viewport.height < window.innerHeight * 0.9;
      if (keyboardOpen) {
        containerRef.current.style.height = `${viewport.height}px`;
        bottomRef.current?.scrollIntoView({ behavior: "instant" });
      } else {
        containerRef.current.style.height = "";
      }
    };

    viewport.addEventListener("resize", updateHeight);
    return () => viewport.removeEventListener("resize", updateHeight);
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
    <div
      ref={containerRef}
      className="flex h-full w-full flex-col overflow-hidden"
    >
      {/* Message list */}
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-txt-muted text-sm">{t("emptyConversation")}</p>
          </div>
        ) : (
          messages.map((msg) => {
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_id === currentUserId}
              />
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
                const el = e.target;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={t("messageInputPlaceholder")}
              disabled={sending}
              row={1}
              style={{ maxHeight: "120px", overflowY: "auto" }}
              className="py-2"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            variant="primary"
            size="sm"
            aria-label={t("sendButton")}
          >
            {t("sendButton")}
          </Button>
        </div>
      </div>
    </div>
  );
}
