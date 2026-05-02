import React, { forwardRef } from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className = '', label, error, children, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-[var(--color-text)] pl-1">{label}</label>}
      <select
        ref={ref}
        className={`h-12 px-4 rounded-xl bg-[var(--color-surface-sunken)] border ${error ? 'border-red-500' : 'border-transparent'} outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 text-base appearance-none ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
});
Select.displayName = 'Select';