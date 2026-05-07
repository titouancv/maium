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
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label className="text-txt pl-1 text-sm font-medium">{label}</label>
        )}
        <Button size="none" variant={variant}>
          <select
            ref={ref}
            className={`${sizes[buttonSize]} w-full appearance-none outline-none ${className}`}
            {...props}
          >
            {children}
          </select>
          {error && (
            <span className="text-error-600 pl-1 text-xs">{error}</span>
          )}
        </Button>
      </div>
    );
  },
);
Select.displayName = "Select";
