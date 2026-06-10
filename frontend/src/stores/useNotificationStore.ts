import { create } from "zustand";

export type NotificationType = "info" | "success" | "error";

export interface Notification {
  /** Bumped on every `notify` so the banner can restart its auto-dismiss timer. */
  id: number;
  message: string;
  type: NotificationType;
}

interface NotificationState {
  notification: Notification | null;
  /** Show the banner. Pass an already-translated message. */
  notify: (message: string, type?: NotificationType) => void;
  /** Hide the banner. */
  dismiss: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notification: null,
  notify: (message, type = "info") =>
    set({ notification: { id: Date.now(), message, type } }),
  dismiss: () => set({ notification: null }),
}));
