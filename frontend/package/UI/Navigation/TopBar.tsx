import React from 'react';

export interface TopBarProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export function TopBar({ className = '', title, leftAction, rightAction, ...props }: TopBarProps) {
  return (
    <header className={`flex items-center justify-between min-h-[56px] px-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-40 ${className}`} {...props}>
      <div className="w-10 flex items-center justify-start">{leftAction}</div>
      <h1 className="text-lg font-semibold text-[var(--color-text)] flex-1 text-center truncate px-2">{title}</h1>
      <div className="w-10 flex items-center justify-end">{rightAction}</div>
    </header>
  );
}