import { create } from "zustand";
import type { NotificationVariant } from "@/constants";

export interface Notification {
  id: number;
  message: string;
  href?: string;
  variant?: NotificationVariant;
}

interface NotificationState {
  notification: Notification | null;
  notify: (message: string, href?: string, variant?: NotificationVariant) => void;
  dismiss: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notification: null,
  notify: (message, href, variant) =>
    set({ notification: { id: Date.now(), message, href, variant } }),
  dismiss: () => set({ notification: null }),
}));
