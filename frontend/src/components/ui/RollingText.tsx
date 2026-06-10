"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface RollingTextProps {
  /** The text to display; changing it rolls the old value out and the new in. */
  value: string;
  /** Key controlling the roll; defaults to `value`. Pass a stable id (e.g. the
   * author id) so identical names across authors still animate. */
  rollKey?: string;
  className?: string;
}

/**
 * Vertical "roll" transition for a single line of text: the current value
 * slides up and fades out while the new value rises from the bottom. Inspired
 * by [NumberRoller](./NumberRoller.tsx) but for arbitrary text — used for the
 * story reader's author name when navigating between authors.
 */
export function RollingText({ value, rollKey, className }: RollingTextProps) {
  return (
    <span
      className={cn(
        "relative inline-flex overflow-hidden align-bottom leading-tight",
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={rollKey ?? value}
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-110%", opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="block whitespace-nowrap"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
