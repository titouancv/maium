import { create } from "zustand";
import type { Conversation } from "@/types";

/** The bits of a conversation needed to render the header instantly. */
export type ConversationPreview = Pick<
  Conversation,
  "id" | "title" | "is_group" | "members"
>;

interface ConversationPreviewStore {
  /** Keyed by conversation id. */
  previews: Record<string, ConversationPreview>;
  /** Seed one or more previews (e.g. when the conversation list renders). */
  setPreviews: (conversations: ConversationPreview[]) => void;
}

/**
 * In-memory cache of conversation metadata, seeded from the messages list so
 * the conversation page can paint its header before the server round-trip
 * resolves. Cleared on full reload — the server stream is the source of truth.
 */
export const useConversationPreviewStore = create<ConversationPreviewStore>(
  (set) => ({
    previews: {},
    setPreviews: (conversations) =>
      set((state) => {
        const previews = { ...state.previews };
        for (const c of conversations) {
          previews[c.id] = {
            id: c.id,
            title: c.title,
            is_group: c.is_group,
            members: c.members,
          };
        }
        return { previews };
      }),
  }),
);
