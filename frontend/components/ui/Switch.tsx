import React, { forwardRef } from "react";

export interface SwitchProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
}

const trackStyles = {
  base: "peer h-6 w-11 rounded-full shadow-md inset-shadow-sm transition-colors duration-300 ease-in-out peer-focus:outline-none",
  unchecked: "bg-inverse-50 inset-shadow-surface-50/80",
  checked:
    "peer-checked:bg-radial peer-checked:from-secondary-400 peer-checked:from-10% peer-checked:to-primary peer-checked:to-90% peer-checked:inset-shadow-light-100/60",
};

const knobStyles = {
  base: "after:bg-surface-50 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-inverse-50 after:transition-all after:content-[''] after:inset-shadow-sm after:inset-shadow-inverse-50/80",
  checked:
    "peer-checked:after:translate-x-full peer-checked:after:bg-on-primary peer-checked:after:border-on-primary peer-checked:after:inset-shadow-sm peer-checked:after:inset-shadow-dark-400/80",
};

const switchClasses = [
  trackStyles.base,
  trackStyles.unchecked,
  trackStyles.checked,
  knobStyles.base,
  knobStyles.checked,
].join(" ");

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
          <div className={switchClasses}></div>
        </div>
      </label>
    );
  },
);
Switch.displayName = "Switch";
