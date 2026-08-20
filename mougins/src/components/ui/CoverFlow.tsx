"use client";

import { useEffect, useRef, useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import { useTranslations } from "next-intl";
import { Icon } from "./icons";

const SIDE_OFFSET_PX = 90;
const SIDE_ROTATE_DEG = 50;
const SIDE_SCALE = 0.78;
const MAX_VISIBLE_OFFSET = 3;
const OFFSCREEN_WRAP_OFFSET = 1;
const MIN_LOOP_SLOTS = 2 * (MAX_VISIBLE_OFFSET + OFFSCREEN_WRAP_OFFSET) + 1;
const DRAG_THRESHOLD_PX = 60;
const DRAG_VELOCITY_THRESHOLD = 400;
const WHEEL_STEP_THRESHOLD_PX = 40;
const WHEEL_STEP_COOLDOWN_MS = 220;
const WHEEL_GESTURE_RESET_MS = 200;
const WHEEL_LINE_HEIGHT_PX = 16;
const WHEEL_PAGE_HEIGHT_PX = 400;

const wrapIndex = (value: number, total: number) =>
  ((value % total) + total) % total;

const shortestOffset = (rawOffset: number, total: number) => {
  const wrapped = wrapIndex(rawOffset, total);
  return wrapped > total / 2 ? wrapped - total : wrapped;
};

const normalizeWheelDelta = (event: WheelEvent) => {
  const raw =
    Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY;
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE)
    return raw * WHEEL_LINE_HEIGHT_PX;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE)
    return raw * WHEEL_PAGE_HEIGHT_PX;
  return raw;
};

export interface CoverFlowProps<T> {
  items: T[];
  activeIndex: number;
  onChange: (index: number) => void;
  renderItem: (item: T, isActive: boolean) => React.ReactNode;
  getKey: (item: T, index: number) => string;
  loop?: boolean;
}

export function CoverFlow<T>({
  items,
  activeIndex,
  onChange,
  renderItem,
  getKey,
  loop = false,
}: CoverFlowProps<T>) {
  const t = useTranslations("common");
  const count = items.length;
  const isLooping = loop && count > 1;

  const [ribbonSlot, setRibbonSlot] = useState(activeIndex);
  const [followedIndex, setFollowedIndex] = useState(activeIndex);

  if (followedIndex !== activeIndex) {
    setFollowedIndex(activeIndex);
    if (count > 0) {
      setRibbonSlot(
        ribbonSlot + shortestOffset(activeIndex - ribbonSlot, count),
      );
    }
  }

  const repeatCount = isLooping ? Math.ceil(MIN_LOOP_SLOTS / count) : 1;
  const slotCount = count * repeatCount;

  const maxVisibleOffset = isLooping
    ? Math.min(
        MAX_VISIBLE_OFFSET,
        Math.floor((slotCount - 1) / 2) - OFFSCREEN_WRAP_OFFSET,
      )
    : MAX_VISIBLE_OFFSET;

  const getOffset = (slotIndex: number) =>
    isLooping
      ? shortestOffset(slotIndex - ribbonSlot, slotCount)
      : slotIndex - activeIndex;

  const goToSlot = (slotIndex: number) => {
    setRibbonSlot(slotIndex);
    setFollowedIndex(wrapIndex(slotIndex, count));
    onChange(wrapIndex(slotIndex, count));
  };

  const goToPrev = () => {
    if (isLooping) goToSlot(ribbonSlot - 1);
    else onChange(Math.max(activeIndex - 1, 0));
  };

  const goToNext = () => {
    if (isLooping) goToSlot(ribbonSlot + 1);
    else onChange(Math.min(activeIndex + 1, count - 1));
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    if (
      offset.x < -DRAG_THRESHOLD_PX ||
      velocity.x < -DRAG_VELOCITY_THRESHOLD
    ) {
      goToNext();
    } else if (
      offset.x > DRAG_THRESHOLD_PX ||
      velocity.x > DRAG_VELOCITY_THRESHOLD
    ) {
      goToPrev();
    }
  };

  const viewportRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef({
    goToPrev,
    goToNext,
    canGoPrev: isLooping || activeIndex > 0,
    canGoNext: isLooping || activeIndex < count - 1,
  });

  useEffect(() => {
    navigationRef.current = {
      goToPrev,
      goToNext,
      canGoPrev: isLooping || activeIndex > 0,
      canGoNext: isLooping || activeIndex < count - 1,
    };
  });

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let accumulated = 0;
    let lastEventTime = 0;
    let lastStepTime = 0;

    const handleWheel = (event: WheelEvent) => {
      const delta = normalizeWheelDelta(event);
      if (delta === 0) return;

      const forward = delta > 0;
      const { canGoPrev, canGoNext } = navigationRef.current;
      const canAdvance = forward ? canGoNext : canGoPrev;
      if (!canAdvance) return;

      event.preventDefault();

      const now = event.timeStamp;
      if (
        now - lastEventTime > WHEEL_GESTURE_RESET_MS ||
        Math.sign(delta) !== Math.sign(accumulated)
      ) {
        accumulated = 0;
      }
      lastEventTime = now;
      accumulated += delta;

      if (Math.abs(accumulated) < WHEEL_STEP_THRESHOLD_PX) return;
      if (now - lastStepTime < WHEEL_STEP_COOLDOWN_MS) return;

      lastStepTime = now;
      accumulated = 0;
      if (forward) navigationRef.current.goToNext();
      else navigationRef.current.goToPrev();
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div className="flex h-full flex-col items-center gap-3">
      <div
        ref={viewportRef}
        className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-x-clip"
        style={{ perspective: 1200 }}
      >
        <motion.div
          className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDragEnd={handleDragEnd}
        />

        <button
          type="button"
          aria-label={t("previousOption")}
          disabled={!isLooping && activeIndex <= 0}
          onClick={goToPrev}
          className="enabled:hover:text-primary absolute left-0 z-20 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300 enabled:cursor-pointer disabled:opacity-0 md:hidden"
        >
          <Icon name="chevronLeft" />
        </button>

        {Array.from({ length: slotCount }, (_, slotIndex) => {
          const itemIndex = slotIndex % count;
          const item = items[itemIndex];
          const offset = getOffset(slotIndex);
          const isActive = offset === 0;
          const absOffset = Math.abs(offset);
          const hidden = absOffset > maxVisibleOffset;
          const itemKey = getKey(item, itemIndex);
          const repeatIndex = Math.floor(slotIndex / count);

          return (
            <motion.div
              key={repeatCount > 1 ? `${itemKey}-${repeatIndex}` : itemKey}
              className="absolute"
              style={{
                zIndex: 100 - absOffset,
                pointerEvents: hidden ? "none" : "auto",
              }}
              animate={{
                x: offset * SIDE_OFFSET_PX,
                rotateY: isActive
                  ? 0
                  : offset < 0
                    ? SIDE_ROTATE_DEG
                    : -SIDE_ROTATE_DEG,
                scale: isActive ? 1 : SIDE_SCALE,
                opacity: hidden ? 0 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              onClick={() => {
                if (isActive) return;
                if (isLooping) goToSlot(slotIndex);
                else onChange(itemIndex);
              }}
            >
              {renderItem(item, isActive)}
            </motion.div>
          );
        })}

        <button
          type="button"
          aria-label={t("nextOption")}
          disabled={!isLooping && activeIndex >= count - 1}
          onClick={goToNext}
          className="enabled:hover:text-primary absolute right-0 z-20 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300 enabled:cursor-pointer disabled:opacity-0 md:hidden"
        >
          <Icon name="chevronRight" />
        </button>
      </div>
    </div>
  );
}
