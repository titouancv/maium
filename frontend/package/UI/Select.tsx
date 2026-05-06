import React, { forwardRef } from "react";
import { Button, ButtonVariant } from "./Button";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  variant?: ButtonVariant;
  buttonSize?: "none" | "sm" | "md" | "lg";
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className = "",
      label,
      error,
      variant,
      buttonSize = "md",
      children,
      ...props
    },
    ref,
  ) => {
    const sizes = {
      none: "text-base",
      sm: "py-1 px-4 text-sm",
      md: "py-2 px-6 text-base",
      lg: "py-2 px-8 text-lg",
    };
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-txt pl-1">{label}</label>
        )}
        <Button size="none" variant={variant}>
          <select
            ref={ref}
            className={`${sizes[buttonSize]} outline-none w-full appearance-none ${className}`}
            {...props}
          >
            {children}
          </select>
          {error && (
            <span className="text-xs text-error-600 pl-1">{error}</span>
          )}
        </Button>
      </div>
    );
  },
);
Select.displayName = "Select";
