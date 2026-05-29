import type { OptimisticMessage } from "@/types";

interface MessageBubbleProps {
  message: OptimisticMessage;
  isOwn: boolean;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isOlderThan24h = now.getTime() - date.getTime() > 24 * 60 * 60 * 1000;

  if (isOlderThan24h) {
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={`flex justify-start`}>
      <div className={`flex flex-col items-start gap-1`}>
        {message.sender && (
          <div className="text-txt-muted flex items-center gap-2">
            <p className={isOwn ? "text-primary" : "text-txt-muted"}>
              {message.sender.first_name} {message.sender.last_name}
            </p>
            <p className="text-xs">{formatTime(message.created_at)}</p>
          </div>
        )}
        <div
          className={`leading-relaxed ${message.optimistic ? "opacity-70" : ""}`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
