import { INFO_COLORS, type InfoType } from "@/constants";
import { cn } from "@/lib/utils";

interface InfoMessageProps {
  message?: string | null;
  type?: InfoType;
  size?: "xs" | "sm";
  className?: string;
}

export function InfoMessage({
  message,
  type = "error",
  size = "sm",
  className,
}: InfoMessageProps) {
  if (!message) return null;

  return (
    <p
      role={type === "error" ? "alert" : undefined}
      className={cn(
        INFO_COLORS[type],
        size === "xs" ? "text-xs" : "text-sm",
        className,
      )}
    >
      {message}
    </p>
  );
}
