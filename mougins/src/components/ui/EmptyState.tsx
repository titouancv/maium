import { cn } from "@/lib/utils";
import { Text } from "./Text";

interface EmptyStateProps {
  label: string;
  align?: "start" | "center";
  className?: string;
}

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
