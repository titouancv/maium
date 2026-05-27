"use client";

import { useTranslations } from "next-intl";
import { NavigationBar, Title } from "@/components/ui";
import { ConversationList } from "@/components/messaging";
import { NewConversationButton } from "@/components/messaging/NewConversationButton";
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
    <div className="relative flex h-dvh flex-col md:h-screen md:items-center">
      <div className="flex h-full w-full flex-col gap-6 md:h-screen">
        {/* Header */}
        <div className="flex shrink-0 justify-center px-4">
          <div className="flex w-full max-w-7xl shrink-0 items-center justify-between pt-6 md:pt-12">
            <Title label={t("title")} size="h1" />
            <NewConversationButton />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto">
          <div className="w-full max-w-2xl">
            <ConversationList
              conversations={conversations}
              currentUserId={currentUserId}
            />
          </div>
          <div className="h-24 shrink-0 md:h-32" />
        </div>
      </div>

      <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-12 [mask-image:linear-gradient(to_top,black_20%,transparent)] backdrop-blur-sm" />
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <NavigationBar />
      </div>
    </div>
  );
}
