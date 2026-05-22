import { create } from "zustand";
import type { Experience } from "@/types/experience";

export interface UserState {
  email?: string;
  firstName?: string;
  lastName?: string;
  pseudo?: string;
  dob?: number;
  supabaseId?: string;
  professionalExperiences?: Experience[];
  educationalExperiences?: Experience[];
}

interface UserStore {
  user: UserState | null;
  setUser: (data: Partial<UserState>) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (data) => set((state) => ({ user: { ...state.user, ...data } })),
}));
