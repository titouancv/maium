"use client";

import { use } from "react";
import type { Conversation } from "@/types";
import { ConversationList } from "./ConversationList";

interface ConversationsLoaderProps {
  conversationsPromise: Promise<Conversation[]>;
  currentUserId: string;
}

/** Unwraps the streamed conversations promise inside a Suspense boundary. */
export function ConversationsLoader({
  conversationsPromise,
  currentUserId,
}: ConversationsLoaderProps) {
  const conversations = use(conversationsPromise);
  return (
    <ConversationList
      conversations={conversations}
      currentUserId={currentUserId}
    />
  );
}
