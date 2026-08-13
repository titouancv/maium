import { cn } from "@/lib/utils";

interface ScrollRowProps {
  stretch?: boolean;
  className?: string;
  children: React.ReactNode;
}

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
