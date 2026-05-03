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
          <label className="text-sm font-medium text-text">{label}</label>
        )}
        <input
          ref={ref}
          className={`h-12 ${error ? " text-error-text" : ""}  transition-all w-full ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs text-error-border pl-1">{error}</span>
        )}
      </div>
    );
  },
);
TextInput.displayName = "TextInput";
