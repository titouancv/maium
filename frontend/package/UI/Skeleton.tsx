import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-border animate-pulse rounded-sm ${className}`} />;
}
