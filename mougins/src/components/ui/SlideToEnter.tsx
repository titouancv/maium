"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PRIMARY_COLORS } from "@/constants/ui";
import { Icon } from "./icons";

interface SlideToEnterProps {
  onConfirm: () => void;
  label: string;
  className?: string;
}

const THUMB_SIZE = 52;
const PADDING = 4;
const THRESHOLD = 0.85;

export function SlideToEnter({
  onConfirm,
  label,
  className,
}: SlideToEnterProps) {
  const [offset, setOffset] = useState(0);
  const [done, setDone] = useState(false);
  const [trackWidth, setTrackWidth] = useState(300);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTrackWidth(el.offsetWidth));
    ro.observe(el);
    setTrackWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  const maxOffset = trackWidth - THUMB_SIZE - PADDING * 2;

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startXRef.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startXRef.current === null || done) return;
    const delta = e.clientX - startXRef.current;
    setOffset(Math.max(0, Math.min(delta, maxOffset)));
  };

  const handlePointerUp = () => {
    if (startXRef.current === null) return;
    startXRef.current = null;
    const max = maxOffset;
    if (offset >= max * THRESHOLD) {
      setOffset(max);
      setDone(true);
      setTimeout(onConfirm, 350);
    } else {
      setOffset(0);
    }
  };

  const progress = maxOffset > 0 ? offset / maxOffset : 0;
  const isAnimating = done || offset === 0;

  return (
    <div
      ref={trackRef}
      className={cn(
        "bg-surface-100/50 relative flex h-14 w-full max-w-xs items-center overflow-hidden rounded-full select-none",
        className,
      )}
    >
      <span
        className="text-txt pointer-events-none absolute inset-0 flex items-center justify-center text-sm transition-opacity duration-150"
        style={{ opacity: Math.max(0, 1 - progress * 2.5) }}
      >
        {label}
      </span>

      <div
        className={cn(
          PRIMARY_COLORS,
          "relative z-10 flex h-[52px] w-[52px] shrink-0 cursor-grab touch-none items-center justify-center rounded-full shadow-md inset-shadow-sm active:cursor-grabbing",
        )}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isAnimating
            ? "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)"
            : "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div style={{ opacity: Math.max(0.3, 1 - progress) }}>
          <Icon name="arrowRight" size={20} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}
