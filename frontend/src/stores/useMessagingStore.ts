import { create } from "zustand";
import type { Conversation } from "@/types";

/** The last-message preview fields the conversations list needs to render. */
export type LastMessagePreview = {
  content: string;
  created_at: string;
  sender_id: string;
};

interface ApplyMessageOptions {
  /** The conversation currently open, if any — its incoming messages count as read. */
  activeConversationId?: string;
  /** The viewer's id, used to advance their read marker on the active conversation. */
  currentUserId?: string;
}

interface MessagingStore {
  /** Authoritative conversation list, most-recently-active first. */
  conversations: Conversation[];
  /** Latest local read timestamp (ISO) per conversation id (advances only). */
  readAt: Record<string, string>;

  /**
   * Merge authoritative server data into the store. The server owns the set,
   * membership and members; we keep any locally-newer `last_message` so a
   * message that arrived via Realtime while the list was unmounted (served
   * stale from the Router Cache on return) is not lost.
   */
  hydrate: (conversations: Conversation[]) => void;
  /**
   * Apply a sent/received message to a known conversation: bump its
   * `last_message`, advance the viewer's read marker when it's the active
   * conversation, and re-sort. No-op for unknown conversations (the layout
   * refetches the list in that case).
   */
  applyMessage: (
    conversationId: string,
    message: LastMessagePreview,
    options?: ApplyMessageOptions,
  ) => void;
  /** Record that we read a conversation up to `readAt` (monotonic). */
  markRead: (conversationId: string, readAt: string) => void;
}

/** Most-recently-active first; falls back to creation date when no message. */
function sortByActivity(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => {
    const aDate = a.last_message?.created_at ?? a.created_at;
    const bDate = b.last_message?.created_at ?? b.created_at;
    return bDate.localeCompare(aDate);
  });
}

/**
 * Single source of truth for the messaging UI on the client.
 *
 * The conversations list and a conversation view are separate routes, so the
 * list (and its Realtime subscription) used to die whenever a conversation was
 * open — losing messages and serving a stale Router-Cached list on return. A
 * single Realtime subscription mounted in the messaging layout now writes here,
 * and every messaging view reads from this store, so the list, previews and
 * read state stay correct across navigation without per-route refreshes. The
 * streamed server data stays authoritative and reconciles via `hydrate`.
 */
export const useMessagingStore = create<MessagingStore>((set) => ({
  conversations: [],
  readAt: {},

  hydrate: (incoming) =>
    set((state) => {
      const prevById = new Map(state.conversations.map((c) => [c.id, c]));
      const merged = incoming.map((c) => {
        const prev = prevById.get(c.id);
        if (
          prev?.last_message &&
          (!c.last_message ||
            prev.last_message.created_at > c.last_message.created_at)
        ) {
          return { ...c, last_message: prev.last_message };
        }
        return c;
      });
      return { conversations: sortByActivity(merged) };
    }),

  applyMessage: (conversationId, message, options) =>
    set((state) => {
      let found = false;
      const next = state.conversations.map((c) => {
        if (c.id !== conversationId) return c;
        found = true;

        const isActive = options?.activeConversationId === conversationId;
        const myId = options?.currentUserId;
        const members =
          isActive && myId
            ? c.members.map((m) =>
                m.id === myId
                  ? { ...m, last_read_at: message.created_at }
                  : m,
              )
            : c.members;

        const last_message =
          !c.last_message || message.created_at > c.last_message.created_at
            ? message
            : c.last_message;

        return { ...c, members, last_message };
      });

      if (!found) return state;
      return { conversations: sortByActivity(next) };
    }),

  markRead: (conversationId, readAt) =>
    set((state) => {
      const existing = state.readAt[conversationId];
      if (existing && existing >= readAt) return state;
      return { readAt: { ...state.readAt, [conversationId]: readAt } };
    }),
}));
