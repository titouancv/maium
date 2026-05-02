import React from 'react';

export function Divider({ className = '' }: { className?: string }) {
  return <hr className={`border-t border-border w-full my-4 ${className}`} />;
}