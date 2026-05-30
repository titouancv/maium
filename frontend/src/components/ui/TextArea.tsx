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
      <div className="flex h-full w-full flex-col gap-1.5">
        <textarea
          ref={ref}
          rows={row}
          className={cn(
            "h-full w-full resize-none p-2 transition-all placeholder:uppercase",
            infoType === "error"
              ? "text-error bg-error/10"
              : "text-txt hover:bg-surface-100 focus:bg-surface-100 [&:not(:placeholder-shown)]:bg-surface-100",
            "rounded-xl p-1 outline-none",
            className,
          )}
          {...props}
        />
        <span className={cn(INFO_COLORS[infoType], "pl-1 text-xs")}>
          {infoLabel || " "}
        </span>
      </div>
    );
  },
);
TextArea.displayName = "TextArea";
