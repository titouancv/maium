import { create } from "zustand";
import type { StoryData, StoryGroup } from "@/types/story";
import type { UserSummary } from "@/types/user";

interface StoriesStore {
  /** Authoritative grouped feed (own stories first, then unseen, then recent). */
  groups: StoryGroup[];
  /** Story ids the viewer has seen locally (kept across re-hydration). */
  seenIds: Set<string>;

  /**
   * Reconcile streamed server data into the store. Server owns the set and its
   * order; locally-seen ids are re-applied so the "unseen" ring never flickers
   * back when a stale Router-Cached feed is served on return.
   */
  hydrate: (groups: StoryGroup[]) => void;
  /** Mark a story as seen (optimistic; also persisted via the view API). */
  markSeen: (storyId: string) => void;
  /** Toggle the viewer's like on a story (optimistic). */
  setLiked: (storyId: string, liked: boolean) => void;
  /** Insert a freshly created/ reposted story into the viewer's own group. */
  addStory: (story: StoryData, author: UserSummary) => void;
  /** Remove a story (optimistic); drops the author's group if it becomes empty. */
  removeStory: (storyId: string) => void;
}

function applySeen(group: StoryGroup, seenIds: Set<string>): StoryGroup {
  const stories = group.stories.map((s) =>
    seenIds.has(s.id) && !s.seen ? { ...s, seen: true } : s,
  );
  return { ...group, stories, hasUnseen: stories.some((s) => !s.seen) };
}

export const useStoriesStore = create<StoriesStore>((set) => ({
  groups: [],
  seenIds: new Set(),

  hydrate: (incoming) =>
    set((state) => ({
      groups: incoming.map((g) => applySeen(g, state.seenIds)),
    })),

  markSeen: (storyId) =>
    set((state) => {
      const seenIds = new Set(state.seenIds).add(storyId);
      return {
        seenIds,
        groups: state.groups.map((g) =>
          g.stories.some((s) => s.id === storyId)
            ? applySeen(g, seenIds)
            : g,
        ),
      };
    }),

  setLiked: (storyId, liked) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.stories.some((s) => s.id === storyId)
          ? {
              ...g,
              stories: g.stories.map((s) =>
                s.id === storyId ? { ...s, likedByMe: liked } : s,
              ),
            }
          : g,
      ),
    })),

  addStory: (story, author) =>
    set((state) => {
      const others = state.groups.filter(
        (g) => g.author.pseudo !== author.pseudo,
      );
      const mine = state.groups.find((g) => g.author.pseudo === author.pseudo);
      const updated: StoryGroup = {
        author,
        // Newest story last keeps the progress bar in chronological order.
        stories: [...(mine?.stories ?? []), story],
        hasUnseen: false,
      };
      // The viewer's own group is always shown first.
      return { groups: [updated, ...others] };
    }),

  removeStory: (storyId) =>
    set((state) => ({
      groups: state.groups
        .map((g) => {
          if (!g.stories.some((s) => s.id === storyId)) return g;
          const stories = g.stories.filter((s) => s.id !== storyId);
          return { ...g, stories, hasUnseen: stories.some((s) => !s.seen) };
        })
        .filter((g) => g.stories.length > 0),
    })),
}));
