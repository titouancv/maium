"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { UI_VARIANTS, UIVariant } from "@/constants";
import { Icon } from "./icons";

export interface ChipProps {
  label: string;
  variant?: UIVariant;
  onRemove?: () => void;
  onClick?: () => void;
  href?: string;
  selected?: boolean;
  className?: string;
}

export function Chip({
  label,
  variant = "outlineSecondary",
  onRemove,
  onClick,
  href,
  selected,
  className,
}: ChipProps) {
  const t = useTranslations("common");
  const resolvedVariant = selected ? "primary" : variant;

  const content = (
    <>
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
    </>
  );

  const classes = cn(
    "inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-sm font-medium",
    UI_VARIANTS[resolvedVariant],
    className,
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {content}
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={classes}
      >
        {content}
      </button>
    );
  }

  return <span className={classes}>{content}</span>;
}
