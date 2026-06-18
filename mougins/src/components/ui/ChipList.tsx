import React from "react";
import { cn } from "@/lib/utils";
import { Chip } from "./Chip";
import { UIVariant } from "@/constants/ui";

export interface ChipListProps {
  items: string[];
  variant?: UIVariant;
  onRemove?: (index: number) => void;
  className?: string;
}

export function ChipList({
  items,
  variant = "outlineMuted",
  onRemove,
  className,
}: ChipListProps) {
  return (
    <div className={cn("flex flex-wrap", onRemove && "gap-2", className)}>
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
