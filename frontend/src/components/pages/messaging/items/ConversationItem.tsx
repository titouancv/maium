import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/constants";
import type { Conversation, ConversationMember } from "@/types";
import { UserCard } from "@/components/ui/UserCard";

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId: string;
  active?: boolean;
}

function getDisplayName(
  conversation: Conversation,
  currentUserId: string,
): string {
  if (conversation.is_group && conversation.title) return conversation.title;
  const other = conversation.members.find((m) => m.id !== currentUserId);
  if (other) return `${other.first_name} ${other.last_name}`;
  return "Conversation";
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
): boolean {
  const lastMessage = conversation.last_message;
  if (!lastMessage || lastMessage.sender_id === currentUserId) return false;
  const me = conversation.members.find((m) => m.id === currentUserId);
  if (!me?.last_read_at) return true;
  return new Date(me.last_read_at) < new Date(lastMessage.created_at);
}

export function ConversationItem({
  conversation,
  currentUserId,
  active = false,
}: ConversationItemProps) {
  const displayName = getDisplayName(conversation, currentUserId);
  const subtitle = getSubtitle(conversation);
  const unread = hasUnreadMessage(conversation, currentUserId);
  const other = conversation.members.find(
    (m: ConversationMember) => m.id !== currentUserId,
  );

  if (other) {
    return (
      <UserCard
        pseudo={other.pseudo}
        first_name={other.first_name}
        last_name={other.last_name}
        href={ROUTES.CONVERSATION(conversation.id)}
        subtitle={subtitle ?? `@${other.pseudo}`}
        subtitleClassName={unread ? "text-primary" : undefined}
      />
    );
  }

  return (
    <Link
      href={ROUTES.CONVERSATION(conversation.id)}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
        active ? "bg-surface-200" : "hover:bg-surface-100"
      }`}
    >
      <div className="bg-surface-200 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm">
        {displayName[0]?.toUpperCase() ?? "?"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-txt truncate text-sm">{displayName}</p>
        {subtitle && (
          <p
            className={`truncate text-xs ${unread ? "text-primary" : "text-txt-muted"}`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </Link>
  );
}
