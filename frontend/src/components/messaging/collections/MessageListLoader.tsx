"use client";

import { use } from "react";
import type { Message } from "@/types";
import { MessageList } from "./MessageList";

interface MessageListLoaderProps {
  conversationId: string;
  messagesPromise: Promise<Message[]>;
  currentUserId: string;
  isGroup: boolean;
}

/** Unwraps the streamed messages promise inside a Suspense boundary. */
export function MessageListLoader({
  conversationId,
  messagesPromise,
  currentUserId,
  isGroup,
}: MessageListLoaderProps) {
  const initialMessages = use(messagesPromise);
  return (
    <MessageList
      conversationId={conversationId}
      initialMessages={initialMessages}
      currentUserId={currentUserId}
      isGroup={isGroup}
    />
  );
}
