import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-brd-400 animate-pulse rounded-sm ${className}`} />;
}
