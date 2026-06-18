import { UserSummary } from "./user";

export interface StoryData {
  id: string;
  authorId: string;
  /** Markdown content. */
  content: string;
  isRepost: boolean;
  originalAuthorId?: string | null;
  originalStoryId?: string | null;
  /**
   * Original author (reposts only): shown in the reader header (linking to
   * their profile) and in the « Republié depuis @… » mention.
   */
  originalAuthor?: UserSummary | null;
  /** Epoch ms. */
  createdAt: number;
  /** Whether the current viewer has already seen this story. */
  seen: boolean;
  /** Whether the current viewer has liked this story. */
  likedByMe: boolean;
  /** Whether the current viewer has already reposted this story. */
  repostedByMe: boolean;
  /** Total number of likes on this story (across all users). */
  likeCount: number;
  /** Total number of reposts of this story (across all users). */
  repostCount: number;
  /**
   * Viewers of the story, carried with the feed so the author-only viewers list
   * paints instantly. Populated only on the viewer's own stories (empty array
   * otherwise — server-side authorization), most-recent-first.
   */
  viewers: StoryViewer[];
}

/** The four Notion-like block kinds, each serialized to a markdown primitive. */
export type StoryBlockType = "heading" | "text" | "highlight" | "bullet";

/** A single draft block while composing a story in the block editor. */
export interface StoryBlock {
  id: string;
  type: StoryBlockType;
  text: string;
}

/**
 * A user who viewed one of the author's stories, with whether they also liked
 * and/or reposted it (shown as indicators in the author-only viewers list).
 */
export interface StoryViewer extends UserSummary {
  liked: boolean;
  reposted: boolean;
}

/** One author's stories, grouped for the home stories row and the reader. */
export interface StoryGroup {
  author: UserSummary;
  stories: StoryData[];
  /** True when at least one story in the group is unseen by the viewer. */
  hasUnseen: boolean;
}
