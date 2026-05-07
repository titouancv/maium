import React, { forwardRef } from "react";

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className = "", label, error, ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label className="text-txt px-2 text-sm font-medium">{label}</label>
        )}
        <input
          ref={ref}
          className={`h-12 w-full transition-all ${error ? "text-error bg-error/10" : "text-txt hover:bg-surface-100 focus:bg-surface-100"} rounded-xl px-2 py-1 outline-none ${className}`}
          {...props}
        />
        {error && (
          <span className="text-error pl-1 text-xs font-bold">{error}</span>
        )}
      </div>
    );
  },
);
TextInput.displayName = "TextInput";
