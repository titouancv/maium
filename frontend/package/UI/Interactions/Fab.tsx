import React from 'react';

export interface FabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function Fab({ className = '', children, ...props }: FabProps) {
  return (
    <button className={`fixed bottom-20 right-4 w-14 h-14 bg-[var(--color-primary)] text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40 ${className}`} {...props}>
      {children}
    </button>
  );
}