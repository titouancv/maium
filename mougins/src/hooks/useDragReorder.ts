"use client";

import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { flushSync } from "react-dom";
import { moveItem } from "@/lib/utils";

/** How long a card takes to slide into its new slot. */
const SNAP_MS = 160;

/** Centre of a slot in the list, with no drag offset applied. */
export interface Slot {
  cx: number;
  cy: number;
}

/**
 * The slot a card dragged by (offsetX, offsetY) now covers better than its own,
 * or null when it still belongs where it is. Comparing centres — rather than
 * asking which card sits under the pointer — is what lets the grab area live
 * anywhere on the card, and leaves no dead zone in the gaps of a grid.
 *
 * Exported for testing.
 */
export function nearestSlot(
  slots: (Slot | null)[],
  index: number,
  offsetX: number,
  offsetY: number,
): number | null {
  const own = slots[index];
  if (!own) return null;
  const cx = own.cx + offsetX;
  const cy = own.cy + offsetY;

  let best: number | null = null;
  let bestDistance = offsetX ** 2 + offsetY ** 2;
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (i === index || !slot) continue;
    const distance = (cx - slot.cx) ** 2 + (cy - slot.cy) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}

interface DragState<T> {
  pointerId: number;
  /** The order as it stands mid-gesture — the props are a render behind. */
  items: T[];
  index: number;
  grabX: number;
  grabY: number;
  offsetX: number;
  offsetY: number;
  /** Where every card rests, measured with no transition in flight. */
  slots: (Slot | null)[];
  moved: boolean;
}

export interface DragHandleProps {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

interface UseDragReorderOptions<T> {
  items: T[];
  /** Runs on every step of the gesture — keep it cheap, it is flushed synchronously. */
  onReorder: (next: T[]) => void;
  /** Runs once the gesture ends, and only if the order actually changed. */
  onCommit?: (next: T[]) => void;
}

/**
 * Drag-to-reorder for a list or a grid, driven by Pointer Events so it works
 * with a mouse and with touch alike.
 *
 * The list reorders live under the finger. What decides the new position is
 * the **dragged card's own centre**, never the pointer: the grab area can sit
 * anywhere on the card — a corner of a photo, the left edge of a row — and a
 * card takes over a slot as soon as it covers more of it than of its own.
 *
 * Consumers must key their items by identity (see `itemKey`) — with index keys
 * React rewrites the cards' content instead of moving their nodes, and the
 * gesture loses the element it is carrying.
 */
export function useDragReorder<T>({
  items,
  onReorder,
  onCommit,
}: UseDragReorderOptions<T>) {
  const elements = useRef<(HTMLElement | null)[]>([]);
  const drag = useRef<DragState<T> | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const itemRef = useCallback(
    (index: number) => (element: HTMLElement | null) => {
      elements.current[index] = element;
    },
    [],
  );

  /** Glues the card to the pointer, re-derived from where the card now rests. */
  const follow = (
    state: DragState<T>,
    element: HTMLElement,
    pointerX: number,
    pointerY: number,
  ) => {
    const rect = element.getBoundingClientRect();
    state.offsetX = pointerX - state.grabX - (rect.left - state.offsetX);
    state.offsetY = pointerY - state.grabY - (rect.top - state.offsetY);
    element.style.transform = `translate3d(${state.offsetX}px, ${state.offsetY}px, 0)`;
  };

  /**
   * Reads each card's resting slot. Any FLIP still running is cancelled first:
   * an animating card measures mid-flight, which would be read as layout and
   * send the next hit test to the wrong slot.
   */
  const measureSlots = (
    state: DragState<T>,
    dragged: HTMLElement | null,
  ): (DOMRect | null)[] => {
    const count = state.items.length;
    for (let i = 0; i < count; i++) {
      const element = elements.current[i];
      if (!element || element === dragged) continue;
      element.style.transition = "none";
      element.style.transform = "";
    }

    const rects: (DOMRect | null)[] = [];
    state.slots = [];
    for (let i = 0; i < count; i++) {
      const element = elements.current[i];
      const rect = element?.getBoundingClientRect() ?? null;
      rects.push(rect);
      if (!rect) {
        state.slots.push(null);
        continue;
      }
      const carried = element === dragged;
      state.slots.push({
        cx: rect.left + rect.width / 2 - (carried ? state.offsetX : 0),
        cy: rect.top + rect.height / 2 - (carried ? state.offsetY : 0),
      });
    }
    return rects;
  };

  const handlePointerDown =
    (index: number) => (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const element = elements.current[index];
      if (!element || items.length < 2) return;

      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();

      const state: DragState<T> = {
        pointerId: event.pointerId,
        items,
        index,
        grabX: 0,
        grabY: 0,
        offsetX: 0,
        offsetY: 0,
        slots: [],
        moved: false,
      };
      measureSlots(state, null);
      element.style.transition = "none";
      element.style.transform = "";
      element.style.willChange = "transform";

      const rect = element.getBoundingClientRect();
      state.grabX = event.clientX - rect.left;
      state.grabY = event.clientY - rect.top;

      drag.current = state;
      setDraggingIndex(index);
    };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId) return;
    const element = elements.current[state.index];
    if (!element) return;

    follow(state, element, event.clientX, event.clientY);

    const target = nearestSlot(
      state.slots,
      state.index,
      state.offsetX,
      state.offsetY,
    );
    if (target === null) return;

    // Where every card sits right now — mid-animation included, that is what
    // the eye sees and what the next slide has to start from.
    const before = elements.current
      .slice(0, state.items.length)
      .map((node) =>
        node ? { node, rect: node.getBoundingClientRect() } : null,
      );

    const next = moveItem(state.items, state.index, target);
    flushSync(() => {
      onReorder(next);
      setDraggingIndex(target);
    });
    state.items = next;
    state.index = target;
    state.moved = true;

    const carried = elements.current[state.index];
    const rects = measureSlots(state, carried);

    for (const entry of before) {
      if (!entry || entry.node === carried) continue;
      const rect = rects[elements.current.indexOf(entry.node)];
      if (!rect) continue;
      const dx = entry.rect.left - rect.left;
      const dy = entry.rect.top - rect.top;
      if (!dx && !dy) continue;
      entry.node.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      void entry.node.offsetWidth; // let the browser take the jump first
      entry.node.style.transition = `transform ${SNAP_MS}ms ease`;
      entry.node.style.transform = "";
    }

    if (carried) follow(state, carried, event.clientX, event.clientY);
  };

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId) return;
    drag.current = null;
    setDraggingIndex(null);

    const element = elements.current[state.index];
    if (element) {
      element.style.transition = `transform ${SNAP_MS}ms ease`;
      element.style.transform = "";
      setTimeout(() => {
        element.style.transition = "";
        element.style.willChange = "";
      }, SNAP_MS);
    }

    if (state.moved) onCommit?.(state.items);
  };

  /** Arrow keys move a card one slot, so reordering never needs a pointer. */
  const handleKeyDown =
    (index: number) => (event: KeyboardEvent<HTMLElement>) => {
      const delta =
        event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : event.key === "ArrowRight" || event.key === "ArrowDown"
            ? 1
            : 0;
      if (!delta) return;
      const to = index + delta;
      if (to < 0 || to >= items.length) return;
      event.preventDefault();
      const next = moveItem(items, index, to);
      onReorder(next);
      onCommit?.(next);
    };

  const handleProps = (index: number): DragHandleProps => ({
    onPointerDown: handlePointerDown(index),
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
    onKeyDown: handleKeyDown(index),
  });

  return { draggingIndex, itemRef, handleProps };
}
