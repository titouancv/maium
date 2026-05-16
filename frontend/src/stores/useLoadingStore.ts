import { create } from "zustand";

interface LoadingState {
  suppressed: boolean;
  suppress: () => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  suppressed: false,
  suppress: () => set({ suppressed: true }),
}));
