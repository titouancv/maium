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
            "bg-surface-100 inset-shadow-dark-900/40 dark:inset-shadow-dark-900 h-12 w-full rounded-xl p-1 inset-shadow-sm transition-all outline-none placeholder:uppercase",
            // Errors recolour the text only — no tinted panel behind the field.
            infoType === "error" ? "text-error" : "text-txt",
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
