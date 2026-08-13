import { cn } from "@/lib/utils";

/**
 * The vertical bar that marks a row — an experience, a hobby, a message, a
 * quote. It is how this app separates items: no card, no border, no background,
 * just a rail in the current text colour.
 *
 * Stretches to the row's height by default; pass `h-*` for a fixed one, or
 * `bg-primary` to mark the row as the user's own.
 */
export function Rail({ className }: { className?: string }) {
  return (
    <div
      className={cn("w-1 shrink-0 self-stretch rounded-full bg-current", className)}
    />
  );
}
