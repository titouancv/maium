import React, { forwardRef } from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-txt pl-1">{label}</label>
        )}
        <select
          ref={ref}
          className={`h-12 px-4 rounded-sm bg-surface-200 border ${error ? "border-error-400 text-error-600" : "border-transparent"} outline-none focus:ring-2 focus:ring-primary/20 text-base appearance-none ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-xs text-error-600 pl-1">{error}</span>}
      </div>
    );
  },
);
Select.displayName = "Select";
