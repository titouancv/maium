"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { NOTIFICATION_VARIANTS } from "@/constants";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/useNotificationStore";

/** How long a notification stays before it auto-dismisses. */
const AUTO_DISMISS_MS = 5000;
/**
 * Minimum number of message copies. The actual count is derived from the
 * message + viewport width (see {@link Marquee}) so the strip always spans the
 * screen; it must stay a multiple of 4 so the `-25%` scroll loops seamlessly.
 */
const MIN_MARQUEE_COPIES = 4;

/**
 * Global alert band shown at the top of {@link PageLayout}. Reads the current
 * notification from {@link useNotificationStore}; trigger one from anywhere via
 * `useNotificationStore.getState().notify("…")`.
 */
const marqueeClasses =
  "min-w-0 flex-1 overflow-hidden font-extrabold uppercase";

export function NotificationBanner() {
  const t = useTranslations("common");
  const notification = useNotificationStore((s) => s.notification);
  const dismiss = useNotificationStore((s) => s.dismiss);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [notification, dismiss]);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          key={notification.id}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed top-0 right-0 left-0 z-[80] shrink-0 overflow-hidden"
          role="status"
          aria-live="polite"
        >
          <div
            className={cn(
              "flex w-full items-center gap-3 pt-10 pr-4 pb-2 md:pt-2",
              NOTIFICATION_VARIANTS[notification.variant ?? "primary"],
            )}
          >
            {notification.href ? (
              <Link
                href={notification.href}
                onClick={dismiss}
                className={marqueeClasses}
              >
                <Marquee message={notification.message} />
              </Link>
            ) : (
              <div className={marqueeClasses}>
                <Marquee message={notification.message} />
              </div>
            )}
            <button
              type="button"
              onClick={dismiss}
              aria-label={t("dismissNotification")}
              className="shrink-0 rounded-full p-1 transition-opacity hover:cursor-pointer hover:opacity-70 active:scale-95"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Marquee({ message }: { message: string }) {
  const [copies, setCopies] = useState(MIN_MARQUEE_COPIES);
  const unitRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const recompute = () => {
      const unitWidth = unitRef.current?.getBoundingClientRect().width ?? 0;
      if (!unitWidth) return;
      // The strip scrolls left by 25%, so only 75% of it is ever on-screen:
      // size it so that 75% still spans the viewport, then round up to a
      // multiple of 4 to keep the loop seamless.
      const needed = window.innerWidth / 0.75 / unitWidth;
      setCopies(Math.max(MIN_MARQUEE_COPIES, Math.ceil(needed / 4) * 4));
    };
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [message]);

  return (
    <motion.div
      className="flex w-max"
      animate={{ x: ["0%", "-25%"] }}
      transition={{ duration: 20, ease: "linear", repeat: Infinity }}
    >
      {Array.from({ length: copies }).map((_, i) => (
        <Fragment key={i}>
          <span
            ref={i === 0 ? unitRef : undefined}
            className="pr-4 whitespace-nowrap md:pr-8"
          >
            {message}
          </span>
          <span className="pr-4 md:pr-8">•</span>
        </Fragment>
      ))}
    </motion.div>
  );
}
