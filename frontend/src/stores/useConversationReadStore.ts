import { create } from "zustand";

interface ConversationReadStore {
  /** Latest local read timestamp (ISO) per conversation id. */
  readAt: Record<string, string>;
  /** Record that we read a conversation up to `readAt` (monotonic). */
  markRead: (conversationId: string, readAt: string) => void;
}

/**
 * In-memory marker of the conversations we've opened this session, keyed by id.
 *
 * The conversations list and a conversation view are separate routes, so after
 * reading a conversation and navigating back the list is served from the Router
 * Cache with a stale `last_read_at` — the message keeps showing as unread until
 * a hard refresh. MessageList writes our read position here when it marks a
 * conversation read, and ConversationItem folds it into the unread check so the
 * list reflects the read state instantly, without a server round-trip. The
 * streamed server data stays authoritative; this only ever advances the marker.
 */
export const useConversationReadStore = create<ConversationReadStore>((set) => ({
  readAt: {},
  markRead: (conversationId, readAt) =>
    set((state) => {
      const existing = state.readAt[conversationId];
      if (existing && existing >= readAt) return state;
      return { readAt: { ...state.readAt, [conversationId]: readAt } };
    }),
}));
