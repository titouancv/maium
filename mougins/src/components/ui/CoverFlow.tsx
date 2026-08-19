"use client";

import { motion, type PanInfo } from "framer-motion";
import { useTranslations } from "next-intl";
import { Icon } from "./icons";

const SIDE_OFFSET_PX = 90;
const SIDE_ROTATE_DEG = 50;
const SIDE_SCALE = 0.78;
const MAX_VISIBLE_OFFSET = 3;
const DRAG_THRESHOLD_PX = 60;
const DRAG_VELOCITY_THRESHOLD = 400;

export interface CoverFlowProps<T> {
  items: T[];
  activeIndex: number;
  onChange: (index: number) => void;
  renderItem: (item: T, isActive: boolean) => React.ReactNode;
  getKey: (item: T, index: number) => string;
}

export function CoverFlow<T>({
  items,
  activeIndex,
  onChange,
  renderItem,
  getKey,
}: CoverFlowProps<T>) {
  const t = useTranslations("common");

  const handleDragEnd = (
    _: unknown,
    info: PanInfo,
  ) => {
    const { offset, velocity } = info;
    if (offset.x < -DRAG_THRESHOLD_PX || velocity.x < -DRAG_VELOCITY_THRESHOLD) {
      onChange(Math.min(activeIndex + 1, items.length - 1));
    } else if (offset.x > DRAG_THRESHOLD_PX || velocity.x > DRAG_VELOCITY_THRESHOLD) {
      onChange(Math.max(activeIndex - 1, 0));
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative flex h-full w-full items-center justify-center"
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
          disabled={activeIndex <= 0}
          onClick={() => onChange(activeIndex - 1)}
          className="enabled:hover:text-primary absolute left-0 z-20 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300 enabled:cursor-pointer disabled:opacity-0"
        >
          <Icon name="chevronLeft" />
        </button>

        {items.map((item, index) => {
          const offset = index - activeIndex;
          const isActive = offset === 0;
          const absOffset = Math.abs(offset);
          const hidden = absOffset > MAX_VISIBLE_OFFSET;

          return (
            <motion.div
              key={getKey(item, index)}
              className="absolute"
              style={{ zIndex: 100 - absOffset }}
              animate={{
                x: offset * SIDE_OFFSET_PX,
                rotateY: isActive ? 0 : offset < 0 ? SIDE_ROTATE_DEG : -SIDE_ROTATE_DEG,
                scale: isActive ? 1 : SIDE_SCALE,
                opacity: hidden ? 0 : isActive ? 1 : 0.6,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              onClick={() => !isActive && onChange(index)}
            >
              {renderItem(item, isActive)}
            </motion.div>
          );
        })}

        <button
          type="button"
          aria-label={t("nextOption")}
          disabled={activeIndex >= items.length - 1}
          onClick={() => onChange(activeIndex + 1)}
          className="enabled:hover:text-primary absolute right-0 z-20 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300 enabled:cursor-pointer disabled:opacity-0"
        >
          <Icon name="chevronRight" />
        </button>
      </div>

      {items.length > 1 && (
        <span className="text-txt-muted text-sm">
          {activeIndex + 1} / {items.length}
        </span>
      )}
    </div>
  );
}
