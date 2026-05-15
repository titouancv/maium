import React, { forwardRef } from "react";

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  infoLabel?: string;
  infoType?: "error" | "success" | "info";
  placeholder: string;
}

const infoColors = {
  error: "text-error",
  success: "text-primary",
  info: "text-txt",
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className = "", infoLabel = "", infoType = "info", ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1.5">
        <input
          ref={ref}
          className={`h-12 w-full transition-all placeholder:uppercase ${
            infoType === "error"
              ? "text-error bg-error/10"
              : "text-txt hover:bg-surface-100 focus:bg-surface-100"
          } rounded-xl p-1 outline-none ${className}`}
          {...props}
        />
        <span className={`${infoColors[infoType]} pl-1 text-xs`}>
          {infoLabel || " "}
        </span>
      </div>
    );
  },
);
TextInput.displayName = "TextInput";
