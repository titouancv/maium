import React, { forwardRef } from "react";

export interface SwitchProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className = "", label, ...props }, ref) => {
    return (
      <label
        className={`flex items-center justify-between min-h-[44px] cursor-pointer ${className}`}
      >
        {label && (
          <span className="text-base font-medium text-text pr-4">{label}</span>
        )}
        <div className="relative inline-flex items-center shrink-0">
          <input
            type="checkbox"
            ref={ref}
            className="sr-only peer"
            {...props}
          />
          <div className="w-11 h-6 bg-border-strong peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </div>
      </label>
    );
  },
);
Switch.displayName = "Switch";
