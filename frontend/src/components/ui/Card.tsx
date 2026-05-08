import React from "react";
import { ButtonVariant } from "./Button";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  variant?: ButtonVariant;
}

export function Card({
  className = "",
  padding = "md",
  variant = "outline",
  children,
  ...props
}: CardProps) {
  const baseStyle =
    "flex flex-col gap-4 rounded-md items-center justify-center shadow-md inset-shadow-sm";
  const cardPadding: { [key in "none" | "sm" | "md" | "lg"]: string } = {
    none: "",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
  };
  const cardVariants: { [key in ButtonVariant]: string } = {
    primary:
      "bg-radial from-secondary-400 from-10% to-primary to-90% text-on-primary inset-shadow-light-100/60",
    inverse: "bg-inverse-50 text-txt-inverse inset-shadow-surface-50/80",
    outline:
      "text-txt inset-shadow-primary-200/80 dark:inset-shadow-primary-400/80",
    ghost: "bg-transparent text-txt shadow-none inset-shadow-transparent",
  };

  return (
    <section
      className={` ${className} ${cardPadding[padding]} ${cardVariants[variant]} ${baseStyle}`}
      {...props}
    >
      {children}
    </section>
  );
}
