import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ className = '', padding = 'md', children, ...props }: CardProps) {
  const paddings = { none: 'p-0', sm: 'p-3', md: 'p-4 md:p-6', lg: 'p-6 md:p-8' };
  return (
    <div className={`bg-[var(--color-surface-raised)] rounded-2xl md:rounded-3xl shadow-sm border border-[var(--color-border)] ${paddings[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
}