import { cn } from "@/lib/utils";

/**
 * The short bar that sits under a heading. `bg-current` so it takes the colour
 * of the title above it — the app's headings are marked by this bar rather
 * than by a rule, a box or a background.
 */
export function AccentBar({ className }: { className?: string }) {
  return (
    <div className={cn("h-1 w-22 shrink-0 rounded-full bg-current", className)} />
  );
}
