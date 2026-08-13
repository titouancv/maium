import { cn } from "@/lib/utils";

interface ScrollRowProps {
  /** Stretches every child to the tallest one (cards with a bottom action). */
  stretch?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * A row that scrolls sideways when it overflows, with the scrollbar hidden —
 * the home page's suggestions and recent analyses.
 */
export function ScrollRow({
  stretch = false,
  className,
  children,
}: ScrollRowProps) {
  return (
    <div
      className={cn(
        "hide-scrollbar flex gap-6 overflow-x-auto",
        stretch && "items-stretch",
        className,
      )}
    >
      {children}
    </div>
  );
}
