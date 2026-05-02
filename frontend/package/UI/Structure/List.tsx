import React from 'react';

// Wrapper for mobile-friendly lists
export function List({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-2 ${className}`}>{children}</div>;
}