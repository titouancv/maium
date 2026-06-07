import { create } from "zustand";

/** The last-message preview fields the conversations list needs to render. */
export type LastMessagePreview = {
  content: string;
  created_at: string;
  sender_id: string;
};

interface ConversationLastMessageStore {
  /** Latest known last-message per conversation id. */
  lastMessages: Record<string, LastMessagePreview>;
  /** Record a conversation's newest message (monotonic by created_at). */
  setLastMessage: (
    conversationId: string,
    message: LastMessagePreview,
  ) => void;
}

/**
 * In-memory mirror of the newest message per conversation, keyed by id.
 *
 * The conversations list and a conversation view are separate routes, so while
 * a conversation is open the list (and its Realtime subscription) is unmounted.
 * A message sent or received during that time never reaches the list, and on
 * navigating back the list is served from the Router Cache with a stale
 * `last_message` and stale ordering — until a hard refresh. MessageList writes
 * here on send/receive, and ConversationList folds it into its items (updating
 * the preview and re-sorting) so the list is correct instantly, without a
 * server round-trip. The streamed server data stays authoritative; this only
 * ever advances the marker.
 */
export const useConversationLastMessageStore =
  create<ConversationLastMessageStore>((set) => ({
    lastMessages: {},
    setLastMessage: (conversationId, message) =>
      set((state) => {
        const existing = state.lastMessages[conversationId];
        if (existing && existing.created_at >= message.created_at) return state;
        return {
          lastMessages: { ...state.lastMessages, [conversationId]: message },
        };
      }),
  }));
