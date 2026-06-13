import type { StoryData } from "@/types/story";

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
  } | null;
};

/** Subset select string to embed the author + original author for a story row. */
export const STORY_SELECT = `
  id, author_id, content, is_repost, original_author_id, original_story_id, created_at,
  original_author:original_author_id(pseudo, first_name, last_name)
`.trim();

/** Author summary embedded alongside a story when grouping the feed. */
export const STORY_AUTHOR_SELECT =
  "author:author_id(pseudo, first_name, last_name)";

export function mapStoryFromDb(
  raw: DbStoryRaw,
  flags: { seen: boolean; likedByMe: boolean; repostedByMe: boolean },
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
        }
      : null,
    createdAt: new Date(raw.created_at).getTime(),
    seen: flags.seen,
    likedByMe: flags.likedByMe,
    repostedByMe: flags.repostedByMe,
  };
}
