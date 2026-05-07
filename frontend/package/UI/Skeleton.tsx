import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-surface-200 animate-pulse rounded-sm ${className}`} />
  );
}
