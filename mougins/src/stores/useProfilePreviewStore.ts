import { create } from "zustand";
import type { UserSummary } from "@/types";

export type ProfilePreview = Pick<
  UserSummary,
  "pseudo" | "first_name" | "last_name"
>;

interface ProfilePreviewStore {
  previews: Record<string, ProfilePreview>;
  setPreview: (preview: ProfilePreview) => void;
}

export const useProfilePreviewStore = create<ProfilePreviewStore>((set) => ({
  previews: {},
  setPreview: (preview) =>
    set((state) => ({
      previews: { ...state.previews, [preview.pseudo]: preview },
    })),
}));
