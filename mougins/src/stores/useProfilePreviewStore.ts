import { create } from "zustand";
import type { UserSummary } from "@/types";

/** The bits of a profile needed to render its header title instantly. */
export type ProfilePreview = Pick<
  UserSummary,
  "pseudo" | "first_name" | "last_name"
>;

interface ProfilePreviewStore {
  /** Keyed by pseudo. */
  previews: Record<string, ProfilePreview>;
  /** Seed a preview (e.g. on click of a UserCard linking to the profile). */
  setPreview: (preview: ProfilePreview) => void;
}

/**
 * In-memory cache of profile names, seeded when a UserCard is clicked so the
 * profile page can paint its title before the server round-trip resolves.
 * Cleared on full reload — the streamed server data is the source of truth.
 */
export const useProfilePreviewStore = create<ProfilePreviewStore>((set) => ({
  previews: {},
  setPreview: (preview) =>
    set((state) => ({
      previews: { ...state.previews, [preview.pseudo]: preview },
    })),
}));
