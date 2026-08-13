"use client";

import { use } from "react";
import type { Conversation } from "@/types";
import { ConversationList } from "./ConversationList";

interface ConversationsLoaderProps {
  conversationsPromise: Promise<Conversation[]>;
}

export function ConversationsLoader({
  conversationsPromise,
}: ConversationsLoaderProps) {
  const conversations = use(conversationsPromise);
  return <ConversationList conversations={conversations} />;
}
