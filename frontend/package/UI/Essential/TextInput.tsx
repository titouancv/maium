import React, { forwardRef } from 'react';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-sm font-medium text-[var(--color-text)] pl-1">{label}</label>}
        <input
          ref={ref}
          className={`h-12 px-4 rounded-xl bg-[var(--color-surface-sunken)] border ${error ? 'border-red-500' : 'border-transparent focus:border-[var(--color-primary)]'} outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 text-base transition-all w-full ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-500 pl-1">{error}</span>}
      </div>
    );
  }
);
TextInput.displayName = 'TextInput';