import { getConversationById, getMessages } from "@/lib/messaging/server";
import { ConversationContent } from "@/components/pages/messaging";

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

// Auth is enforced in proxy.ts. Nothing is awaited beyond the route params:
// the conversation (header + membership check) and the messages both stream
// into their Suspense boundaries, and the header paints instantly from the
// preview store seeded by the conversation list.
export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { conversationId } = await params;

  const conversationPromise = getConversationById(conversationId);
  const messagesPromise = getMessages(conversationId);

  return (
    <ConversationContent
      conversationId={conversationId}
      conversationPromise={conversationPromise}
      messagesPromise={messagesPromise}
    />
  );
}
