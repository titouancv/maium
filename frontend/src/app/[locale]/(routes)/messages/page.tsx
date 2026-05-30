import { getConversations } from "@/lib/messaging/server";
import { MessagingContent } from "@/components/pages/messaging";

// Auth is enforced in proxy.ts, so the page renders immediately and the
// conversations stream into the list's Suspense boundary.
export default function MessagesPage() {
  // Not awaited: streams into the conversation list's Suspense boundary.
  const conversationsPromise = getConversations();

  return <MessagingContent conversationsPromise={conversationsPromise} />;
}
