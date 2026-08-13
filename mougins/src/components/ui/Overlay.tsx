"use client";

import { useEffect, useId, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Ids of every mounted overlay, deepest last. Escape only reaches the last one:
 * a sub-form opened from inside another overlay (e.g. HobbiesForm's editor
 * inside EditInfoOverlay) must close itself, not the whole stack.
 */
const stack: string[] = [];

interface OverlayProps {
  /**
   * Closes the overlay. Wired to Escape; the layout inside still owns its own
   * back/cancel button. Omit it for an overlay that can't be dismissed.
   */
  onClose?: () => void;
  /** Centers the children instead of letting them own the whole viewport. */
  center?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * The app's single full-screen overlay: a portalled `fixed inset-0` surface
 * that fades in, closes on Escape, and paints `bg-surface-50` so the page
 * underneath doesn't show through.
 *
 * It carries no chrome of its own — put a [PageLayout], [FormLayout] or
 * [SearchLayout] inside for the header and buttons. Wrap it in framer-motion's
 * `AnimatePresence` to get the fade on the way out too.
 */
export function Overlay({
  onClose,
  center = false,
  className,
  children,
}: OverlayProps) {
  const id = useId();
  // `createPortal` needs the DOM, so the server pass renders nothing.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    stack.push(id);
    return () => {
      const index = stack.indexOf(id);
      if (index !== -1) stack.splice(index, 1);
    };
  }, [id]);

  useEffect(() => {
    if (!onClose) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (stack[stack.length - 1] !== id) return;
      onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [id, onClose]);

  if (!mounted) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      role="dialog"
      aria-modal="true"
      className={cn(
        "bg-surface-50 fixed inset-0 z-50",
        center && "flex items-center justify-center",
        className,
      )}
    >
      {children}
    </motion.div>,
    document.body,
  );
}
