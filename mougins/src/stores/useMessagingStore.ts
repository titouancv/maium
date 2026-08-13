import { create } from "zustand";
import type { Conversation } from "@/types";

export type LastMessagePreview = {
  content: string;
  created_at: string;
  sender_id: string;
};

interface ApplyMessageOptions {
  activeConversationId?: string;
  currentUserId?: string;
}

interface MessagingStore {
  conversations: Conversation[];
  readAt: Record<string, string>;

  hydrate: (conversations: Conversation[]) => void;
  applyMessage: (
    conversationId: string,
    message: LastMessagePreview,
    options?: ApplyMessageOptions,
  ) => void;
  markRead: (conversationId: string, readAt: string) => void;
}

function sortByActivity(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => {
    const aDate = a.last_message?.created_at ?? a.created_at;
    const bDate = b.last_message?.created_at ?? b.created_at;
    return bDate.localeCompare(aDate);
  });
}

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
