"use client";

import { useLayoutEffect, useRef } from "react";
import {
  animate,
  motion,
  useMotionValue,
  type Transition,
} from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SELECTOR_PEEK_PX, scaleColor } from "@/constants/ui";
import { Icon } from "./icons";

export interface SelectorValue {
  label: string;
  color?: string;
}

export interface SelectorProps {
  values: (string | SelectorValue)[];
  activeIndex: number;
  onChange: (index: number) => void;
}

const SLIDE: Transition = { type: "spring", stiffness: 380, damping: 30 };

const EDGE_FADE = `linear-gradient(to right, transparent, #000 ${SELECTOR_PEEK_PX}px, #000 calc(100% - ${SELECTOR_PEEK_PX}px), transparent)`;

export function Selector({ values, activeIndex, onChange }: SelectorProps) {
  const t = useTranslations("common");
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const valueRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const paintedRef = useRef(false);
  const width = useMotionValue<number | string>("auto");
  const x = useMotionValue(0);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const alignToActive = () => {
      const active = valueRefs.current[activeIndex];
      if (!active) return;

      const activeStyle = getComputedStyle(active);
      const activePadding =
        parseFloat(activeStyle.paddingLeft) +
        parseFloat(activeStyle.paddingRight);

      const widestValue = valueRefs.current.reduce((widest, node, index) => {
        if (!node) return widest;
        const valueWidth = node.getBoundingClientRect().width;
        return Math.max(
          widest,
          index === activeIndex ? valueWidth : valueWidth + activePadding,
        );
      }, 0);

      const nextWidth = widestValue + SELECTOR_PEEK_PX * 2;
      width.set(nextWidth);

      const rect = active.getBoundingClientRect();
      const offset = rect.left - track.getBoundingClientRect().left;
      const visibleWidth = Math.min(
        nextWidth,
        viewport.getBoundingClientRect().width,
      );
      const nextX = (visibleWidth - rect.width) / 2 - offset;

      if (!paintedRef.current) {
        paintedRef.current = true;
        x.set(nextX);
        return;
      }

      if (x.get() !== nextX) animate(x, nextX, SLIDE);
    };

    alignToActive();
    const observer = new ResizeObserver(alignToActive);
    observer.observe(track);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [values, activeIndex, width, x]);

  return (
    <div className="bg-inverse-50 text-txt-inverse flex w-max max-w-full items-center gap-1 rounded-full p-1">
      <button
        type="button"
        aria-label={t("previousOption")}
        disabled={activeIndex <= 0}
        onClick={() => onChange(activeIndex - 1)}
        className="enabled:hover:text-primary flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-300 disabled:opacity-30"
      >
        <Icon name="chevronLeft" />
      </button>

      <motion.div
        ref={viewportRef}
        className="relative overflow-hidden"
        style={{
          width,
          maxWidth: "100%",
          maskImage: EDGE_FADE,
          WebkitMaskImage: EDGE_FADE,
        }}
      >
        <motion.div className="flex w-max gap-2" ref={trackRef} style={{ x }}>
          {values.map((value, index) => {
            const isString = typeof value === "string";
            const label = isString ? value : value.label;
            const color =
              (isString ? undefined : value.color) ??
              scaleColor(index, values.length);
            const isActive = index === activeIndex;

            return (
              <button
                key={index}
                type="button"
                ref={(node) => {
                  valueRefs.current[index] = node;
                }}
                onClick={() => onChange(index)}
                tabIndex={isActive ? 0 : -1}
                className={cn(
                  "rounded-full py-1 whitespace-nowrap transition-colors duration-300",
                  isActive &&
                    "text-on-primary inset-shadow-light-100/60 px-4 shadow-md inset-shadow-sm",
                )}
                style={isActive ? { backgroundColor: color } : { color }}
              >
                {label}
              </button>
            );
          })}
        </motion.div>
      </motion.div>

      <button
        type="button"
        aria-label={t("nextOption")}
        disabled={activeIndex >= values.length - 1}
        onClick={() => onChange(activeIndex + 1)}
        className="enabled:hover:text-primary flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-300 disabled:opacity-30"
      >
        <Icon name="chevronRight" />
      </button>
    </div>
  );
}
