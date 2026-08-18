"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { AccentBar } from "./AccentBar";

export type TitleSize = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  size?: TitleSize;
  label: string;
}

const sizes: Record<TitleSize, string> = {
  h1: "text-3xl font-extrabold",
  h2: "text-2xl font-extrabold",
  h3: "text-xl font-extrabold",
  h4: "text-lg font-extrabold",
  h5: "text-base font-extrabold",
  h6: "text-sm font-extrabold",
};

const MAX_LINES = 2;
const MIN_FONT_SIZE_PX = 10;

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function Title({
  className = "",
  size = "h2",
  label,
  style,
  ...props
}: TitleProps) {
  const Tag = size;
  const textRef = useRef<HTMLHeadingElement>(null);
  const [fontSize, setFontSize] = useState<number | undefined>(undefined);

  useIsomorphicLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;

    let lastWidth = -1;

    const shrinkToFit = () => {
      el.style.fontSize = "";
      const baseFontSize = parseFloat(window.getComputedStyle(el).fontSize);
      let current = baseFontSize;
      let lineHeight = parseFloat(window.getComputedStyle(el).lineHeight);

      while (
        current > MIN_FONT_SIZE_PX &&
        el.scrollHeight > lineHeight * MAX_LINES + 1
      ) {
        current -= 1;
        el.style.fontSize = `${current}px`;
        lineHeight = parseFloat(window.getComputedStyle(el).lineHeight);
      }

      setFontSize(current < baseFontSize ? current : undefined);
    };

    shrinkToFit();

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (Math.abs(width - lastWidth) < 1) return;
      lastWidth = width;
      shrinkToFit();
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [label, size]);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex justify-start">
        <Tag
          ref={textRef}
          className={sizes[size]}
          style={{
            ...style,
            fontSize: fontSize ? `${fontSize}px` : undefined,
          }}
          {...props}
        >
          {label}
        </Tag>
      </div>
      <AccentBar />
    </div>
  );
}
