import { cn } from "@/lib/utils";
import { UI_VARIANTS, UIVariant } from "@/constants";

export interface ChipProps {
  label: string;
  variant?: UIVariant;
  onRemove?: () => void;
  className?: string;
}

export function Chip({
  label,
  variant = "outlineSecondary",
  onRemove,
  className,
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
        UI_VARIANTS[variant],
        className,
      )}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-current opacity-60 transition-opacity hover:opacity-100"
          aria-label={`Remove ${label}`}
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <line x1="1" y1="1" x2="7" y2="7" />
            <line x1="7" y1="1" x2="1" y2="7" />
          </svg>
        </button>
      )}
    </span>
  );
}
