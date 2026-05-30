import { create } from "zustand";

interface PresenceStore {
  /** Ids of users currently online (app open somewhere). */
  onlineUserIds: Set<string>;
  setOnline: (ids: string[]) => void;
}

/**
 * Global online-presence cache, fed by the `presence:online` realtime channel
 * (see [PresenceTracker]). Components read it to show whether a user is online.
 */
export const usePresenceStore = create<PresenceStore>((set) => ({
  onlineUserIds: new Set(),
  setOnline: (ids) => set({ onlineUserIds: new Set(ids) }),
}));
