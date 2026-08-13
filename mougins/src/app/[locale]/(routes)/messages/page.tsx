import { getConversations } from "@/lib/messaging/server";
import { MessagingContent } from "@/components/pages/messaging";

export default function MessagesPage() {
  const conversationsPromise = getConversations();

  return <MessagingContent conversationsPromise={conversationsPromise} />;
}
