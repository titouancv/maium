"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { Rail } from "@/components/ui/Rail";

// Mirrors the real message rows: a left vertical bar + a name and a few text
// lines. `showSender` matches the grouping rule (name only on the first of a
// group), and `lines` varies the body length so it reads like real messages.
const ROWS = [
  { showSender: true, lines: ["w-48", "w-32"] },
  { showSender: false, lines: ["w-40"] },
  { showSender: true, lines: ["w-56"] },
  { showSender: true, lines: ["w-36", "w-52", "w-28"] },
  { showSender: false, lines: ["w-44"] },
  { showSender: true, lines: ["w-52", "w-40"] },
] as const;

/**
 * Conversation placeholder: skeletons stand in for the messages while the
 * thread streams in, but the input stays rendered (and the layout matches the
 * real {@link MessageList}) so the view doesn't jump when data arrives.
 */
export const MessagesSkeleton = () => {
  const t = useTranslations("messaging");

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Online / typing status row (kept for layout parity) */}
      <div className="h-5 shrink-0" />

      {/* Message list */}
      <div className="flex flex-1 flex-col justify-end gap-1 overflow-hidden py-4">
        {ROWS.map((row, i) => (
          <div key={i} className={`flex justify-start ${row.showSender ? "pt-4" : ""}`}>
            <div className="flex max-w-[95%] flex-col items-start gap-1">
              {row.showSender && <Skeleton className="h-5 w-28 rounded-sm" />}
              <div className="flex w-full gap-2">
                <Rail className="bg-surface-200 my-1" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-1">
                  {row.lines.map((width, j) => (
                    <Skeleton key={j} className={`h-4 ${width} rounded-sm`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input — kept visible so the view doesn't shift when messages load */}
      <div className="shrink-0 pt-2 pb-8">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <TextArea
              placeholder={t("messageInputPlaceholder")}
              row={1}
              className="py-2"
              disabled
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            disabled
            aria-label={t("sendButton")}
            className="hidden md:inline-flex"
          >
            {t("sendButton")}
          </Button>
        </div>
      </div>
    </div>
  );
};
