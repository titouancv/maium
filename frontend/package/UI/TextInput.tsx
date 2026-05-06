import React, { forwardRef } from "react";

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className = "", label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-txt px-2">{label}</label>
        )}
        <input
          ref={ref}
          className={`h-12 transition-all w-full ${error && "text-error"} hover:bg-surface-100 focus:bg-surface-100 outline-none rounded-xl px-2 py-1 ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-error pl-1">{error}</span>}
      </div>
    );
  },
);
TextInput.displayName = "TextInput";
