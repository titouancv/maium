import { cn } from "@/lib/utils";

export function Rail({ className }: { className?: string }) {
  return (
    <div
      className={cn("w-1 shrink-0 self-stretch rounded-full bg-current", className)}
    />
  );
}
