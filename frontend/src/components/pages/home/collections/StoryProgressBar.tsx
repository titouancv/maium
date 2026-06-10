import { cn } from "@/lib/utils";

interface StoryProgressBarProps {
  /** Number of stories in the current author's group. */
  total: number;
  /** Index of the story currently shown. */
  current: number;
}

/**
 * Segmented progress bar above the story content: one segment per story of the
 * current author — already-read segments are filled, the current one is
 * highlighted, the remaining ones stay empty.
 */
export function StoryProgressBar({ total, current }: StoryProgressBarProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="bg-surface-200 h-[3px] flex-1 overflow-hidden rounded-full"
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              i < current && "bg-primary/50 w-full",
              i === current && "bg-primary w-full",
              i > current && "w-0",
            )}
          />
        </div>
      ))}
    </div>
  );
}
