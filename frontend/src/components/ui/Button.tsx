import React from "react";
import { UI_VARIANTS, UIVariant } from "@/constants";
import { cn } from "@/lib/utils";

export type ButtonVariant = UIVariant;
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "none" | "sm" | "md" | "lg";
}

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  const baseStyle =
    "cursor-pointer inline-flex items-center justify-center shadow-md inset-shadow-sm transition-colors duration-300 ease-in-out active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-inverse-50";
  const sizes = {
    none: "text-base rounded-2xl",
    sm: "py-1 px-4 text-sm rounded-xl",
    md: "pt-2 pb-1 px-6 text-md rounded-2xl",
    lg: "pt-2 pb-1 px-8 text-lg rounded-2xl",
  };

  return (
    <button
      className={cn(baseStyle, UI_VARIANTS[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
