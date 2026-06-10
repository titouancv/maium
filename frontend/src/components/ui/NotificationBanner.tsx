"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
  useNotificationStore,
  type NotificationType,
} from "@/stores/useNotificationStore";
import { cn } from "@/lib/utils";

/** How long a notification stays before it auto-dismisses. */
const AUTO_DISMISS_MS = 5000;

const typeStyles: Record<NotificationType, string> = {
  info: "bg-surface-100 text-txt",
  success: "bg-primary/10 text-primary",
  error: "bg-error/10 text-error",
};

function NotificationIcon({ type }: { type: NotificationType }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="10" />
      {type === "success" ? (
        <path d="m8 12 3 3 5-6" />
      ) : type === "error" ? (
        <>
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </>
      ) : (
        <>
          <line x1="12" y1="11" x2="12" y2="16" />
          <line x1="12" y1="8" x2="12" y2="8" />
        </>
      )}
    </svg>
  );
}

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
          className="shrink-0 overflow-hidden"
          role="status"
          aria-live="polite"
        >
          <div
            className={cn(
              "flex w-full justify-center px-4 py-2.5",
              typeStyles[notification.type],
            )}
          >
            <div className="flex w-full max-w-7xl items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <NotificationIcon type={notification.type} />
                <span className="text-sm font-medium">
                  {notification.message}
                </span>
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
