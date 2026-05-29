"use client";

import { useTranslations } from "next-intl";
import { PageLayout } from "../layout";
import { MessageList } from "@/components/custom/messaging";
import type { Conversation, Message } from "@/types";

interface ConversationContentProps {
  conversation: Conversation;
  initialMessages: Message[];
  currentUserId: string;
}

function getDisplayName(
  conversation: Conversation,
  currentUserId: string,
): string {
  if (conversation.is_group && conversation.title) return conversation.title;
  const other = conversation.members.find((m) => m.id !== currentUserId);
  if (other) return `${other.first_name} ${other.last_name}`;
  return "Conversation";
}

export function ConversationContent({
  conversation,
  initialMessages,
  currentUserId,
}: ConversationContentProps) {
  const t = useTranslations("messaging");
  const displayName = getDisplayName(conversation, currentUserId);

  return (
    <PageLayout
      title={displayName}
      backLabel={t("backButton")}
      fullHeight
      showNavigationBar={false}
    >
      <div className="flex h-full w-full max-w-2xl flex-col">
        <MessageList
          conversationId={conversation.id}
          initialMessages={initialMessages}
          currentUserId={currentUserId}
          isGroup={conversation.is_group}
        />
      </div>
    </PageLayout>
  );
}
