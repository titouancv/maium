import type { OptimisticMessage } from "@/types";

interface MessageBubbleProps {
  message: OptimisticMessage;
  isOwn: boolean;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={`flex justify-start`}>
      <div className={`flex max-w-[80%] flex-col items-start gap-1`}>
        {message.sender && (
          <div className="flex items-center gap-2">
            <p className={isOwn ? "text-primary" : "text-txt"}>
              {message.sender.first_name} {message.sender.last_name}
            </p>
            <p className="text-txt-muted text-xs">
              {formatTime(message.created_at)}
            </p>
          </div>
        )}
        <div className="flex w-full gap-1">
          <div
            className={`my-1 w-1 self-stretch rounded-full ${isOwn ? "bg-primary" : "bg-current"}`}
          ></div>
          <div
            className={`min-w-0 flex-1 break-words leading-relaxed ${message.optimistic ? "opacity-70" : ""}`}
          >
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
}
