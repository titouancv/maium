import { create } from "zustand";

export type NotificationType = "info" | "success" | "error";

export interface Notification {
  /** Bumped on every `notify` so the banner can restart its auto-dismiss timer. */
  id: number;
  message: string;
  type: NotificationType;
  /** Optional destination when the user clicks the banner. */
  href?: string;
}

interface NotificationState {
  notification: Notification | null;
  /** Show the banner. Pass an already-translated message. */
  notify: (message: string, type?: NotificationType, href?: string) => void;
  /** Hide the banner. */
  dismiss: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notification: null,
  notify: (message, type = "info", href?) =>
    set({ notification: { id: Date.now(), message, type, href } }),
  dismiss: () => set({ notification: null }),
}));
