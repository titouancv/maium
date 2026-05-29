"use client";

import { useTranslations } from "next-intl";
import { PageLayout } from "../layout";
import { ConversationList } from "./collections/ConversationList";
import { NewConversationButton } from "./NewConversationButton";
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
      <div className="flex h-full w-full max-w-2xl flex-col justify-between gap-4">
        <ConversationList
          conversations={conversations}
          currentUserId={currentUserId}
        />
        <div className="flex w-full items-center justify-end">
          <NewConversationButton />
        </div>
      </div>
    </PageLayout>
  );
}
