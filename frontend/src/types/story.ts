import { UserSummary } from "./user";

export interface StoryData {
  id: string;
  authorId: string;
  /** Markdown content. */
  content: string;
  isRepost: boolean;
  originalAuthorId?: string | null;
  originalStoryId?: string | null;
  /** Pseudo of the original author, for the « Republié depuis @… » mention. */
  originalAuthorPseudo?: string | null;
  /** Epoch ms. */
  createdAt: number;
  /** Whether the current viewer has already seen this story. */
  seen: boolean;
  /** Whether the current viewer has liked this story. */
  likedByMe: boolean;
}

/** One author's stories, grouped for the home stories row and the reader. */
export interface StoryGroup {
  author: UserSummary;
  stories: StoryData[];
  /** True when at least one story in the group is unseen by the viewer. */
  hasUnseen: boolean;
}
