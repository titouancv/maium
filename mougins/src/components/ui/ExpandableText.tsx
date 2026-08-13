"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

/** Literal classes — Tailwind can't generate `line-clamp-${n}` from a variable. */
const CLAMPS = {
  3: "line-clamp-3",
  5: "line-clamp-5",
  10: "line-clamp-10",
} as const;

interface ExpandableTextProps {
  children: string;
  /** Lines shown while collapsed. */
  lines?: keyof typeof CLAMPS;
  className?: string;
}

/**
 * Long copy clamped to a few lines, with a see more / see less toggle that only
 * appears when the text actually overflows.
 */
export function ExpandableText({
  children,
  lines = 5,
  className,
}: ExpandableTextProps) {
  const t = useTranslations("common");
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) setIsClamped(el.scrollHeight > el.clientHeight);
  }, [children]);

  return (
    <div>
      <p
        ref={ref}
        className={cn(
          "text-txt text-sm whitespace-pre-line",
          !expanded && CLAMPS[lines],
          className,
        )}
      >
        {children}
      </p>
      {(isClamped || expanded) && (
        <Button
          type="button"
          variant="ghost"
          size="none"
          className="mt-1 h-auto py-0.5 text-sm"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? t("seeLessButton") : t("seeMoreButton")}
        </Button>
      )}
    </div>
  );
}
