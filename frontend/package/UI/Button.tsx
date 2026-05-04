import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "neutral" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  const baseStyle =
    "inline-flex items-center justify-center rounded-xl font-medium transition-colors active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary:
      "bg-primary text-on-primary hover:bg-primary-400 hover:inset-shadow-xl hover:inset-shadow-secondary",
    secondary: "bg-secondary text-on-secondary hover:bg-secondary-400",
    neutral: "bg-surface-200 text-txt hover:bg-brd-100",
    outline: "border-2 border-brd-200 text-txt hover:bg-surface-100",
    ghost: "bg-transparent text-txt hover:bg-surface-100",
  };
  const sizes = {
    sm: "py-1 px-4 text-sm",
    md: "py-2 px-6 text-base",
    lg: "py-2 px-8 text-lg",
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
