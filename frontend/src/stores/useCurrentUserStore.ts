import { create } from "zustand";
import type { UserData } from "@/types";

interface CurrentUserStore {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
}

export const useCurrentUserStore = create<CurrentUserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
