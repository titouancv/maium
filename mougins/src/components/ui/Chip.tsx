"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { UI_VARIANTS, UIVariant } from "@/constants";
import { Icon } from "./icons";

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
  const t = useTranslations("common");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-sm font-medium",
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
          aria-label={t("removeAriaLabel", { label })}
        >
          <Icon name="close" size={10} strokeWidth={2.5} />
        </button>
      )}
    </span>
  );
}
