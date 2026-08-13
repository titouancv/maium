"use client";

import { useEffect, useId, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const stack: string[] = [];

interface OverlayProps {
  onClose?: () => void;
  center?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Overlay({
  onClose,
  center = false,
  className,
  children,
}: OverlayProps) {
  const id = useId();
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
