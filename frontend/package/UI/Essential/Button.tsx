import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ className = '', variant = 'primary', size = 'md', children, ...props }: ButtonProps) {
  const baseStyle = "inline-flex items-center justify-center rounded-full font-medium transition-colors active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-primary text-on-primary hover:bg-primary-hover",
    secondary: "bg-surface-sunken text-text hover:bg-border",
    outline: "border-2 border-border text-text hover:bg-surface-sunken",
    ghost: "bg-transparent text-text hover:bg-surface-sunken"
  };
  const sizes = { sm: "h-10 px-4 text-sm", md: "h-12 px-6 text-base", lg: "h-14 px-8 text-lg" };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}