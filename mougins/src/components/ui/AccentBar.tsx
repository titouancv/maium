import { cn } from "@/lib/utils";

export function AccentBar({ className }: { className?: string }) {
  return (
    <div className={cn("h-1 w-22 shrink-0 rounded-full bg-current", className)} />
  );
}
