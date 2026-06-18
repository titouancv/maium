import { create } from "zustand";
import type { NotificationVariant } from "@/constants";

export interface Notification {
  /** Bumped on every `notify` so the banner can restart its auto-dismiss timer. */
  id: number;
  message: string;
  /** Optional destination when the user clicks the banner. */
  href?: string;
  /** Color treatment of the banner (defaults to `primary`). */
  variant?: NotificationVariant;
}

interface NotificationState {
  notification: Notification | null;
  /** Show the banner. Pass an already-translated message. */
  notify: (message: string, href?: string, variant?: NotificationVariant) => void;
  /** Hide the banner. */
  dismiss: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notification: null,
  notify: (message, href, variant) =>
    set({ notification: { id: Date.now(), message, href, variant } }),
  dismiss: () => set({ notification: null }),
}));
