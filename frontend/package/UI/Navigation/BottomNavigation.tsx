import React from 'react';

export interface BottomNavigationProps extends React.HTMLAttributes<HTMLDivElement> {}

export function BottomNavigation({ className = '', children, ...props }: BottomNavigationProps) {
  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-t border-[var(--color-border)] pb-safe ${className}`} {...props}>
      <div className="flex items-center justify-around h-[64px] px-2">
        {children}
      </div>
    </nav>
  );
}