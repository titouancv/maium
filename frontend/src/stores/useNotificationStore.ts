import { create } from "zustand";

export interface Notification {
  /** Bumped on every `notify` so the banner can restart its auto-dismiss timer. */
  id: number;
  message: string;
  /** Optional destination when the user clicks the banner. */
  href?: string;
}

interface NotificationState {
  notification: Notification | null;
  /** Show the banner. Pass an already-translated message. */
  notify: (message: string, href?: string) => void;
  /** Hide the banner. */
  dismiss: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notification: null,
  notify: (message, href?) =>
    set({ notification: { id: Date.now(), message, href } }),
  dismiss: () => set({ notification: null }),
}));
