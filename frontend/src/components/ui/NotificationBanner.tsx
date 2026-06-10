"use client";

import { Fragment, useEffect } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { useNotificationStore } from "@/stores/useNotificationStore";

/** How long a notification stays before it auto-dismisses. */
const AUTO_DISMISS_MS = 5000;
const MARQUEE_COPIES = 4;

/**
 * Global alert band shown at the top of {@link PageLayout}. Reads the current
 * notification from {@link useNotificationStore}; trigger one from anywhere via
 * `useNotificationStore.getState().notify("…", "success")`.
 */
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
          className="absolute top-0 right-0 left-0 shrink-0 overflow-hidden"
          role="status"
          aria-live="polite"
        >
          <div className="bg-primary text-on-primary flex w-full items-center gap-3 py-6 pr-4 md:py-2">
            <div className="min-w-0 flex-1 overflow-hidden font-extrabold uppercase">
              <motion.div
                className="flex w-max"
                animate={{ x: ["0%", "-25%"] }}
                transition={{ duration: 20, ease: "linear", repeat: Infinity }}
              >
                {Array.from({ length: MARQUEE_COPIES }).map((_, i) => (
                  <Fragment key={i}>
                    <span className="pr-8 whitespace-nowrap">
                      {notification.message}
                    </span>
                    <span className="pr-8">•</span>
                  </Fragment>
                ))}
              </motion.div>
            </div>
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
