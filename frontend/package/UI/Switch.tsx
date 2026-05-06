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
        className={`flex min-h-[44px] cursor-pointer items-center justify-between ${className}`}
      >
        {label && (
          <span className="text-txt pr-4 text-base font-medium">{label}</span>
        )}
        <div className="relative inline-flex shrink-0 items-center">
          <input
            type="checkbox"
            ref={ref}
            className="peer sr-only"
            {...props}
          />
          <div className="bg-brd-700 peer peer-checked:bg-primary h-6 w-11 rounded-full peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
        </div>
      </label>
    );
  },
);
Switch.displayName = "Switch";
