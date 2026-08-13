import { getConversationById, getMessages } from "@/lib/messaging/server";
import { ConversationContent } from "@/components/pages/messaging";

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

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
