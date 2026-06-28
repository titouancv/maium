import type { Gender } from "@/constants";
import type { StoryData, StoryViewer } from "@/types/story";
import type { UserSummary } from "@/types/user";

export type DbStoryRaw = {
  id: string;
  author_id: string;
  content: string;
  is_repost: boolean;
  original_author_id: string | null;
  original_story_id: string | null;
  created_at: string;
  original_author?: {
    pseudo: string | null;
    first_name: string | null;
    last_name: string | null;
    profile_photo: string | null;
  } | null;
};

/** Subset select string to embed the original author for a freshly inserted story. */
export const STORY_SELECT = `
  id, author_id, content, is_repost, original_author_id, original_story_id, created_at,
  original_author:original_author_id(pseudo, first_name, last_name, profile_photo)
`.trim();

type StoryFlags = {
  seen: boolean;
  likedByMe: boolean;
  repostedByMe: boolean;
  likeCount: number;
  repostCount: number;
};

/**
 * Defaults for a just-created / just-reposted story: unseen by its author,
 * unliked, unreposted, no counts yet. Lets insert routes call `mapStoryFromDb`
 * without restating these every time.
 */
const FRESH_STORY_FLAGS: StoryFlags = {
  seen: false,
  likedByMe: false,
  repostedByMe: false,
  likeCount: 0,
  repostCount: 0,
};

export function mapStoryFromDb(
  raw: DbStoryRaw,
  flags: StoryFlags = FRESH_STORY_FLAGS,
): StoryData {
  return {
    id: raw.id,
    authorId: raw.author_id,
    content: raw.content,
    isRepost: raw.is_repost,
    originalAuthorId: raw.original_author_id,
    originalStoryId: raw.original_story_id,
    originalAuthor: raw.original_author?.pseudo
      ? {
          pseudo: raw.original_author.pseudo,
          first_name: raw.original_author.first_name ?? "",
          last_name: raw.original_author.last_name ?? "",
          profile_photo: raw.original_author.profile_photo,
        }
      : null,
    createdAt: new Date(raw.created_at).getTime(),
    seen: flags.seen,
    likedByMe: flags.likedByMe,
    repostedByMe: flags.repostedByMe,
    likeCount: flags.likeCount,
    repostCount: flags.repostCount,
    // A just-created / just-reposted story has no viewers yet.
    viewers: [],
  };
}

/** Flat row returned by the `get_stories_feed` RPC (one per visible story). */
export type DbStoryFeedRow = {
  id: string;
  author_id: string;
  content: string;
  is_repost: boolean;
  original_author_id: string | null;
  original_story_id: string | null;
  created_at: string;
  like_count: number;
  repost_count: number;
  author_pseudo: string;
  author_first_name: string;
  author_last_name: string;
  author_location: string | null;
  author_profile_photo: string | null;
  author_gender: string | null;
  original_author_pseudo: string | null;
  original_author_first_name: string | null;
  original_author_last_name: string | null;
  original_author_profile_photo: string | null;
  seen: boolean;
  liked_by_me: boolean;
  reposted_by_me: boolean;
  /** Author-only: viewers of this story (empty on others' stories). */
  viewers: StoryViewer[] | null;
};

/** Build the domain story from a flat feed row (flags already resolved server-side). */
export function mapFeedRowToStory(row: DbStoryFeedRow): StoryData {
  return {
    id: row.id,
    authorId: row.author_id,
    content: row.content,
    isRepost: row.is_repost,
    originalAuthorId: row.original_author_id,
    originalStoryId: row.original_story_id,
    originalAuthor: row.original_author_pseudo
      ? {
          pseudo: row.original_author_pseudo,
          first_name: row.original_author_first_name ?? "",
          last_name: row.original_author_last_name ?? "",
          profile_photo: row.original_author_profile_photo,
        }
      : null,
    createdAt: new Date(row.created_at).getTime(),
    seen: row.seen,
    likedByMe: row.liked_by_me,
    repostedByMe: row.reposted_by_me,
    likeCount: row.like_count,
    repostCount: row.repost_count,
    viewers: row.viewers ?? [],
  };
}

/** Author summary carried alongside each feed row, for grouping the feed. */
export function mapFeedRowToAuthor(row: DbStoryFeedRow): UserSummary {
  return {
    pseudo: row.author_pseudo,
    first_name: row.author_first_name,
    last_name: row.author_last_name,
    location: row.author_location,
    profile_photo: row.author_profile_photo,
    gender: (row.author_gender as Gender | null) ?? null,
  };
}
