"use client";

import { useTranslations } from "next-intl";
import { Rail } from "./Rail";
import { cn } from "@/lib/utils";
import type { DragHandleProps } from "@/hooks";

interface Props extends Partial<DragHandleProps> {
  className?: string;
  orientation?: "vertical" | "horizontal";
}

export const DragHandle = ({
  className,
  orientation = "vertical",
  ...handlers
}: Props) => {
  const t = useTranslations("common");

  return (
    <button
      type="button"
      aria-label={t("reorderAriaLabel")}
      className={cn(
        "text-txt-muted group-hover:text-primary hover:text-primary flex w-4 shrink-0 cursor-grab touch-none items-center justify-center self-stretch transition-colors active:cursor-grabbing",
        className,
      )}
      {...handlers}
    >
      <Rail
        className={orientation === "horizontal" ? "h-1 w-6 self-auto" : "my-1"}
      />
    </button>
  );
};
