import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-[var(--color-border)] animate-pulse rounded-md ${className}`} />;
}