import type { OptimisticMessage } from "@/types";

interface MessageBubbleProps {
  message: OptimisticMessage;
  isOwn: boolean;
  showSender?: boolean;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({
  message,
  isOwn,
  showSender = false,
}: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[75%] flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}
      >
        {showSender && !isOwn && message.sender && (
          <p className="text-txt-muted px-1 text-xs">
            {message.sender.first_name} {message.sender.last_name}
          </p>
        )}
        <div
          className={`rounded-2xl px-4 py-2 text-sm leading-relaxed ${
            isOwn
              ? "bg-primary text-on-primary rounded-br-sm"
              : "bg-surface-200 text-txt rounded-bl-sm"
          } ${message.optimistic ? "opacity-70" : ""}`}
        >
          {message.content}
        </div>
        <p className="text-txt-muted px-1 text-[10px]">
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
