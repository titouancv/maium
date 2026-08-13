import { create } from "zustand";

interface PresenceStore {
  onlineUserIds: Set<string>;
  setOnline: (ids: string[]) => void;
}

export const usePresenceStore = create<PresenceStore>((set) => ({
  onlineUserIds: new Set(),
  setOnline: (ids) => set({ onlineUserIds: new Set(ids) }),
}));
