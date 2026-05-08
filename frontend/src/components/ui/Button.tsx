import React from "react";

export type ButtonVariant = "primary" | "inverse" | "outline" | "ghost";
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
    "cursor-pointer inline-flex items-center justify-center shadow-md inset-shadow-sm transition-colors duration-300 ease-in-out active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary:
      "bg-radial from-secondary-400 from-10% to-primary to-90% text-on-primary hover:from-primary hover:to-secondary-400 inset-shadow-light-100/60",
    inverse:
      "bg-inverse-50 text-txt-inverse hover:bg-inverse-200 inset-shadow-surface-50/80 ",
    outline:
      " text-txt hover:bg-surface-200 inset-shadow-primary-200/80 dark:inset-shadow-primary-400/80",
    ghost:
      "bg-transparent text-txt hover:bg-surface-200 shadow-none inset-shadow-transparent",
  };
  const sizes = {
    none: "text-base rounded-2xl",
    sm: "py-1 px-4 text-sm rounded-xl",
    md: "py-2 px-6 text-md rounded-2xl",
    lg: "py-2 px-8 text-lg rounded-2xl",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
