import React, { forwardRef } from "react";

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  infoLabel?: string;
  infoType?: "error" | "success" | "info";
  placeholder: string;
  row?: number;
}

const infoColors = {
  error: "text-error",
  success: "text-primary",
  info: "text-txt",
};

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
          className={`h-full w-full resize-none p-2 transition-all placeholder:uppercase ${
            infoType === "error"
              ? "text-error bg-error/10"
              : "text-txt hover:bg-surface-100 focus:bg-surface-100"
          } rounded-xl p-1 outline-none ${className}`}
          {...props}
        />
        <span className={`${infoColors[infoType]} pl-1 text-xs`}>
          {infoLabel || " "}
        </span>
      </div>
    );
  },
);
TextArea.displayName = "TextArea";
