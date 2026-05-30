import type { OptimisticMessage } from "@/types";
import { formatTime } from "@/lib/date";

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
      <div className={`flex max-w-[95%] flex-col items-start gap-1`}>
        {message.sender && showSender && (
          <div className="flex items-center gap-2">
            <p className={isOwn ? "text-primary" : "text-txt"}>
              {message.sender.first_name} {message.sender.last_name}
            </p>
            <p className="text-txt-muted text-xs">
              {formatTime(message.created_at, locale)}
            </p>
          </div>
        )}
        <div className="flex w-full gap-2">
          <div
            className={`my-1 w-1 self-stretch rounded-full ${isOwn ? "bg-primary" : "bg-current"}`}
          ></div>
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
