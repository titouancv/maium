import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { INFO_COLORS, type InfoType } from "@/constants";

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  infoLabel?: string;
  infoType?: InfoType;
  placeholder: string;
  row?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    { className = "", infoLabel = "", infoType = "info", row = 5, ...props },
    ref,
  ) => {
    return (
      <>
        <div
          className={cn(
            "bg-surface-100 inset-shadow-dark-900/40 dark:inset-shadow-dark-900 flex h-full w-full flex-col gap-1.5 rounded-xl p-2 inset-shadow-sm outline-none",
            infoType === "error" ? "text-error bg-error/10" : "text-txt",
            className,
          )}
        >
          <textarea
            ref={ref}
            rows={row}
            className="h-full w-full resize-none transition-all outline-none placeholder:uppercase"
            {...props}
          />
        </div>
        <span className={cn(INFO_COLORS[infoType], "pl-1 text-xs")}>
          {infoLabel || " "}
        </span>
      </>
    );
  },
);
TextArea.displayName = "TextArea";
