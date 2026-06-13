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
}

/** The four Notion-like block kinds, each serialized to a markdown primitive. */
export type StoryBlockType = "heading" | "text" | "highlight" | "bullet";

/** A single draft block while composing a story in the block editor. */
export interface StoryBlock {
  id: string;
  type: StoryBlockType;
  text: string;
}

/** One author's stories, grouped for the home stories row and the reader. */
export interface StoryGroup {
  author: UserSummary;
  stories: StoryData[];
  /** True when at least one story in the group is unseen by the viewer. */
  hasUnseen: boolean;
}
