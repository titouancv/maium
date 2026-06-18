import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={cn("bg-surface-200 animate-pulse rounded-sm", className)} />
  );
}
