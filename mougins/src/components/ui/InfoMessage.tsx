import { INFO_COLORS, type InfoType } from "@/constants";
import { cn } from "@/lib/utils";

interface InfoMessageProps {
  /**
   * The message. Renders nothing when empty, so call sites can pass a possibly
   * undefined error straight through instead of guarding with `&&`.
   */
  message?: string | null;
  type?: InfoType;
  size?: "xs" | "sm";
  className?: string;
}

/**
 * The single way to show a form/action error, confirmation or hint. Colour
 * comes from `INFO_COLORS` — no background, no border: an error reads as red
 * text at the same level as everything else on the page.
 */
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
