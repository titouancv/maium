import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "inverse" | "neutral" | "outline" | "ghost";
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
    " inline-flex items-center justify-center shadow-md font-medium transition-colors active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary:
      "bg-[radial-gradient(ellipse_at_center,var(--color-secondary)_0%,var(--color-primary)_70%)] text-on-primary hover:bg-[radial-gradient(ellipse_at_center,var(--color-secondary-400)_0%,var(--color-primary-400)_70%)]",
    inverse: "bg-inverse-800 text-txt-inverse hover:bg-inverse-600",
    neutral: "bg-surface-200 text-txt hover:bg-brd-100",
    outline:
      "border-2 border-brd-200 text-txt hover:bg-surface-100  inset-shadow-xl inset-shadow-primary",
    ghost: "bg-transparent text-txt hover:bg-surface-100",
  };
  const sizes = {
    none: "text-base rounded-2xl",
    sm: "py-1 px-4 text-sm rounded-xl",
    md: "py-2 px-6 text-base rounded-2xl",
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
