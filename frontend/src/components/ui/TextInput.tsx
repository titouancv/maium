import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { INFO_COLORS, type InfoType } from "@/constants";

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  infoLabel?: string;
  infoType?: InfoType;
  placeholder: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className = "", infoLabel = "", infoType, ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1.5">
        <input
          ref={ref}
          className={cn(
            "h-12 w-full rounded-xl p-1 transition-all outline-none placeholder:uppercase",
            infoType === "error"
              ? "text-error bg-error/10"
              : "text-txt hover:bg-surface-100 focus:bg-surface-100",
            className,
          )}
          {...props}
        />
        {infoType && (
          <span className={cn(INFO_COLORS[infoType], "pl-1 text-xs")}>
            {infoLabel || " "}
          </span>
        )}
      </div>
    );
  },
);
TextInput.displayName = "TextInput";
