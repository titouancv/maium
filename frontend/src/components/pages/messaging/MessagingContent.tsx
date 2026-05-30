"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { PageLayout } from "../../layout";
import { ConversationsLoader } from "./collections/ConversationsLoader";
import { ConversationListSkeleton } from "./MessagingSkeleton";
import { NewConversationButton } from "./NewConversationButton";
import type { Conversation } from "@/types";

interface MessagingContentProps {
  conversationsPromise: Promise<Conversation[]>;
}

export function MessagingContent({
  conversationsPromise,
}: MessagingContentProps) {
  const t = useTranslations("messaging");

  return (
    <PageLayout title={t("title")}>
      <div className="flex h-full w-full max-w-2xl flex-col justify-between gap-4">
        <Suspense fallback={<ConversationListSkeleton />}>
          <ConversationsLoader conversationsPromise={conversationsPromise} />
        </Suspense>
        <div className="flex w-full items-center justify-end">
          <NewConversationButton />
        </div>
      </div>
    </PageLayout>
  );
}
