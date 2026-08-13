import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function Rail({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(
        "w-1 shrink-0 self-stretch rounded-full bg-current",
        className,
      )}
      style={style}
    />
  );
}
