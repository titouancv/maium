import { create } from "zustand";

export interface UserState {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  pseudo?: string;
  dob?: string;
  supabaseId?: string;
}

interface UserStore {
  user: UserState | null;
  setUser: (data: Partial<UserState>) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (data) => set((state) => ({ user: { ...state.user, ...data } })),
  clearUser: () => set({ user: null }),
}));
