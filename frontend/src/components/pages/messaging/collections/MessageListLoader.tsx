"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import type { Message } from "@/types";
import type { ConversationPreview } from "@/stores/useConversationPreviewStore";
import { MessageList } from "./MessageList";

interface MessageListLoaderProps {
  conversationId: string;
  conversationPromise: Promise<ConversationPreview | null>;
  messagesPromise: Promise<Message[]>;
  currentUserId: string;
}

/**
 * Unwraps the streamed conversation + messages inside a Suspense boundary.
 * The conversation also carries the authoritative membership check: when the
 * viewer is not a member (or it does not exist) it resolves to null → 404.
 */
export function MessageListLoader({
  conversationId,
  conversationPromise,
  messagesPromise,
  currentUserId,
}: MessageListLoaderProps) {
  const conversation = use(conversationPromise);
  if (!conversation) notFound();

  const initialMessages = use(messagesPromise);
  const other = conversation.members.find((m) => m.id !== currentUserId);
  return (
    <MessageList
      conversationId={conversationId}
      initialMessages={initialMessages}
      currentUserId={currentUserId}
      isGroup={conversation.is_group}
      otherUserId={other?.id ?? null}
      otherMember={other ?? null}
      otherLastReadAt={other?.last_read_at ?? null}
    />
  );
}
