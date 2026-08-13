import type { OptimisticMessage } from "@/types";
import { formatTime } from "@/lib/date";
import { cn } from "@/lib/utils";
import { Rail, Text, UserCard } from "@/components/ui";

interface MessageBubbleProps {
  message: OptimisticMessage;
  isOwn: boolean;
  showSender: boolean;
  locale: string;
}

export function MessageBubble({
  message,
  isOwn,
  showSender,
  locale,
}: MessageBubbleProps) {
  return (
    <div
      className={`flex justify-start ${message.sender && showSender && "pt-4"}`}
    >
      <div className={`flex w-full flex-col items-start gap-1`}>
        {message.sender && showSender && (
          <div className="flex w-full items-center justify-between gap-2">
            <UserCard
              pseudo={message.sender.pseudo}
              first_name={message.sender.first_name}
              last_name={message.sender.last_name}
              profilePhoto={message.sender.profile_photo}
              className={cn(
                "flex min-w-0 items-center gap-2 hover:text-primary",
                isOwn ? "text-primary" : "text-txt",
              )}
            />
            <Text tone="muted" size="xs" className="shrink-0">
              {formatTime(message.created_at, locale)}
            </Text>
          </div>
        )}
        <div className="flex w-full gap-2">
          <Rail className={cn("my-1", isOwn && "bg-primary")} />
          <div
            className={`min-w-0 flex-1 leading-relaxed break-words ${message.optimistic ? "opacity-70" : ""}`}
          >
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
}
