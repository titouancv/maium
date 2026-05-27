"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ROUTES } from "@/constants";
import { Button } from "@/components/ui";
import { MessageList } from "@/components/messaging";
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
  const router = useRouter();
  const displayName = getDisplayName(conversation, currentUserId);
  const other = conversation.members.find((m) => m.id !== currentUserId);

  return (
    <div className="flex h-dvh flex-col md:h-screen">
      {/* Header */}
      <div className="shrink-0 px-4 pt-6 pb-3 md:pt-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="none"
            type="button"
            onClick={() => router.push(ROUTES.MESSAGES)}
            className="shrink-0"
          >
            {t("backButton")}
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-txt truncate text-base">{displayName}</p>
            {other && (
              <p className="text-txt-muted truncate text-xs">@{other.pseudo}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages + Input */}
      <div className="min-h-0 flex-1">
        <MessageList
          conversationId={conversation.id}
          initialMessages={initialMessages}
          currentUserId={currentUserId}
          isGroup={conversation.is_group}
        />
      </div>
    </div>
  );
}
