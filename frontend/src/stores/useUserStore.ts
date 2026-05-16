import { create } from "zustand";

export interface ProfessionalExperience {
  company: string;
  role: string;
  description?: string;
  website?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
}

export interface EducationalExperience {
  school: string;
  fieldOfStudy: string;
  description?: string;
  website?: string;
  startYear: string;
  endYear?: string;
}

export interface UserState {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  pseudo?: string;
  dob?: string;
  supabaseId?: string;
  professionalExperiences?: ProfessionalExperience[];
  educationalExperiences?: EducationalExperience[];
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
