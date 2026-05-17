import React from "react";
import { cn } from "@/lib/utils";
import { Chip } from "./Chip";
import { UIVariant } from "@/constants/ui";

export interface ChipListProps {
  items: string[];
  variant?: UIVariant;
  onRemove?: (index: number) => void;
  emptyLabel?: string;
  className?: string;
}

export function ChipList({
  items,
  variant = "outline",
  onRemove,
  emptyLabel,
  className,
}: ChipListProps) {
  if (items.length === 0 && emptyLabel) {
    return <p className="text-txt-muted text-sm">{emptyLabel}</p>;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item, index) => (
        <Chip
          key={`${item}-${index}`}
          label={item}
          variant={variant}
          onRemove={onRemove ? () => onRemove(index) : undefined}
        />
      ))}
    </div>
  );
}
