"use client";

import { useTranslations } from "next-intl";
import { PageLayout } from "../layout";
import { ConversationList } from "@/components/custom/messaging";
import { NewConversationButton } from "@/components/custom/messaging/NewConversationButton";
import type { Conversation } from "@/types";

interface MessagingContentProps {
  conversations: Conversation[];
  currentUserId: string;
}

export function MessagingContent({
  conversations,
  currentUserId,
}: MessagingContentProps) {
  const t = useTranslations("messaging");

  return (
    <PageLayout title={t("title")}>
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-end pb-4">
          <NewConversationButton />
        </div>
        <ConversationList
          conversations={conversations}
          currentUserId={currentUserId}
        />
      </div>
    </PageLayout>
  );
}
