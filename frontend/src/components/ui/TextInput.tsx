import React, { forwardRef } from "react";

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  placeholder: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1.5">
        <input
          ref={ref}
          className={`h-12 w-full transition-all placeholder:uppercase ${error ? "text-error bg-error/10" : "text-txt hover:bg-surface-100 focus:bg-surface-100"} rounded-xl px-2 py-1 outline-none ${className}`}
          {...props}
        />
        {error && <span className="text-error pl-1 text-xs">{error}</span>}
      </div>
    );
  },
);
TextInput.displayName = "TextInput";
