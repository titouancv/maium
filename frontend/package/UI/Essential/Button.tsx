import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ className = '', variant = 'primary', size = 'md', children, ...props }: ButtonProps) {
  const baseStyle = "inline-flex items-center justify-center rounded-xl font-medium transition-colors active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]",
    secondary: "bg-[var(--color-surface-sunken)] text-[var(--color-text)] hover:bg-[var(--color-border)]",
    outline: "border-2 border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-sunken)]",
    ghost: "bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-sunken)]"
  };
  const sizes = { sm: "h-10 px-4 text-sm", md: "h-12 px-6 text-base", lg: "h-14 px-8 text-lg" };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}