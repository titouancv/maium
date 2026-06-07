import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import type { Conversation, ConversationMember } from "@/types";
import { useConversationReadStore } from "@/stores/useConversationReadStore";
import { UserCard } from "@/components/ui/UserCard";

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId: string;
  active?: boolean;
}

function getSubtitle(conversation: Conversation): string | null {
  if (!conversation.last_message) return null;
  const content = conversation.last_message.content;
  const truncated = content.length > 50 ? content.slice(0, 50) + "…" : content;
  return truncated;
}

function hasUnreadMessage(
  conversation: Conversation,
  currentUserId: string,
  localReadAt?: string,
): boolean {
  const lastMessage = conversation.last_message;
  if (!lastMessage || lastMessage.sender_id === currentUserId) return false;
  const me = conversation.members.find((m) => m.id === currentUserId);
  // Use whichever read marker is most recent: the server's last_read_at or the
  // in-session one written when we opened the conversation locally.
  const serverReadAt = me?.last_read_at ?? undefined;
  const lastReadAt =
    !serverReadAt || (localReadAt && localReadAt > serverReadAt)
      ? localReadAt
      : serverReadAt;
  if (!lastReadAt) return true;
  return new Date(lastReadAt) < new Date(lastMessage.created_at);
}

export function ConversationItem({
  conversation,
  currentUserId,
}: ConversationItemProps) {
  const t = useTranslations("messaging");
  const localReadAt = useConversationReadStore(
    (s) => s.readAt[conversation.id],
  );
  const subtitle = getSubtitle(conversation);
  const unread = hasUnreadMessage(conversation, currentUserId, localReadAt);
  const other = conversation.members.find(
    (m: ConversationMember) => m.id !== currentUserId,
  );

  return (
    <UserCard
      pseudo={other?.pseudo ?? ""}
      first_name={other?.first_name ?? t("unknownUser")}
      last_name={other?.last_name ?? ""}
      href={ROUTES.CONVERSATION(conversation.id)}
      subtitle={subtitle ?? t("noMessagesYet")}
      subtitleClassName={unread ? "text-primary" : undefined}
    />
  );
}
