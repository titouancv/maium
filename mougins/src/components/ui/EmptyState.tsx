import { cn } from "@/lib/utils";
import { Text } from "./Text";

interface EmptyStateProps {
  /** Already translated — this component never calls `t()` itself. */
  label: string;
  /**
   * `start` sits in the flow next to whatever follows; `center` claims the
   * empty area of a list that owns its region (a conversation, a feed).
   */
  align?: "start" | "center";
  className?: string;
}

/** What a list renders instead of its rows when it has none. */
export function EmptyState({
  label,
  align = "start",
  className,
}: EmptyStateProps) {
  return (
    <Text
      tone="muted"
      size="sm"
      className={cn(align === "center" && "py-8 text-center", className)}
    >
      {label}
    </Text>
  );
}
