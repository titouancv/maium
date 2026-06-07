"use client";

import { Suspense, use } from "react";
import { useTranslations } from "next-intl";
import { PageLayout } from "../../layout";
import { Title, BackButton, Skeleton } from "../../ui";
import { MessageListLoader } from "./collections/MessageListLoader";
import { MessagesSkeleton } from "./ConversationSkeleton";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { useMessagingStore } from "@/stores/useMessagingStore";
import type { Conversation, Message } from "@/types";

interface ConversationContentProps {
  conversationId: string;
  conversationPromise: Promise<Conversation | null>;
  messagesPromise: Promise<Message[]>;
}

type ConversationPreview = Pick<
  Conversation,
  "is_group" | "title" | "members"
>;

function getDisplayName(
  conversation: ConversationPreview,
  currentUserId: string,
): string {
  if (conversation.is_group && conversation.title) return conversation.title;
  const other = conversation.members.find((m) => m.id !== currentUserId);
  if (other) return `${other.first_name} ${other.last_name}`;
  return "Conversation";
}

export function ConversationContent({
  conversationId,
  conversationPromise,
  messagesPromise,
}: ConversationContentProps) {
  const t = useTranslations("messaging");
  // Hydrated at the layout level, so already set on client navigations.
  const currentUserId = useCurrentUserStore((s) => s.user?.id ?? "");
  // Seeded by the conversations list (via the shared store) so the header can
  // paint instantly; falls back to the streamed title on a hard load/deep link.
  const seeded = useMessagingStore((s) =>
    s.conversations.find((c) => c.id === conversationId),
  );

  // When the list seeded this conversation, the title is a plain string and
  // PageLayout renders the back button for us. Otherwise the title node owns
  // the row and streams the name in (e.g. on a hard load / deep link).
  const title = seeded ? (
    getDisplayName(seeded, currentUserId)
  ) : (
    <>
      <Suspense fallback={<Skeleton className="h-9 w-40" />}>
        <StreamedTitle
          conversationPromise={conversationPromise}
          currentUserId={currentUserId}
        />
      </Suspense>
      <BackButton label={t("backButton")} />
    </>
  );

  return (
    <PageLayout
      title={title}
      documentTitle={seeded ? getDisplayName(seeded, currentUserId) : undefined}
      backLabel={t("backButton")}
      fullHeight
      showNavigationBar={false}
    >
      <div className="flex h-full w-full max-w-2xl flex-col">
        <Suspense fallback={<MessagesSkeleton />}>
          <MessageListLoader
            conversationId={conversationId}
            conversationPromise={conversationPromise}
            messagesPromise={messagesPromise}
            currentUserId={currentUserId}
          />
        </Suspense>
      </div>
    </PageLayout>
  );
}

function StreamedTitle({
  conversationPromise,
  currentUserId,
}: {
  conversationPromise: Promise<Conversation | null>;
  currentUserId: string;
}) {
  const conversation = use(conversationPromise);
  // Membership / existence is enforced in MessageListLoader (which also
  // streams); here we just render whatever name we can.
  const label = conversation
    ? getDisplayName(conversation, currentUserId)
    : "Conversation";
  return <Title label={label} size="h1" />;
}
