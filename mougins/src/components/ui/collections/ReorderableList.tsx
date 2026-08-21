"use client";

import type { ReactNode } from "react";
import { useDragReorder, type DragHandleProps } from "@/hooks";
import { cn, itemKey } from "@/lib/utils";

interface Props<T extends object> {
  items: T[];
  onReorder: (next: T[]) => void;
  /** Runs once a drag ends, for lists that persist their order on the spot. */
  onCommit?: (next: T[]) => void;
  className?: string;
  /** `handleProps` is null when there is nothing to reorder (a single item). */
  children: (
    item: T,
    index: number,
    handleProps: DragHandleProps | null,
  ) => ReactNode;
}

/**
 * Wraps a list or grid in drag-to-reorder. It owns the identity keys the
 * gesture needs and leaves every visual decision to `children`.
 */
export const ReorderableList = <T extends object>({
  items,
  onReorder,
  onCommit,
  className,
  children,
}: Props<T>) => {
  const drag = useDragReorder<T>({ items, onReorder, onCommit });
  const isReorderable = items.length > 1;

  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {items.map((item, i) => (
        <li
          key={itemKey(item)}
          ref={drag.itemRef(i)}
          className={cn(drag.draggingIndex === i && "z-10 opacity-90")}
        >
          {children(item, i, isReorderable ? drag.handleProps(i) : null)}
        </li>
      ))}
    </ul>
  );
};
