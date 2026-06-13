import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/getCurrentUser";
import {
  STORY_SELECT,
  STORY_AUTHOR_SELECT,
  mapStoryFromDb,
  type DbStoryRaw,
} from "@/lib/mappers/story";
import type { StoryData, StoryGroup } from "@/types/story";
import type { UserSummary } from "@/types/user";

type DbFeedRow = DbStoryRaw & {
  author: (UserSummary & { location?: string | null }) | null;
};

const FEED_SELECT = `${STORY_SELECT}, ${STORY_AUTHOR_SELECT}`;

/**
 * Stories visible to the current viewer (own + followed authors, non-expired),
 * grouped by author. RLS already restricts the rows to self + followed authors;
 * the `expires_at` filter prunes stories older than 24h. Seen/liked state is
 * resolved from the viewer's own `story_views` / `story_likes` rows.
 *
 * Groups are ordered: the viewer's own stories first, then groups with unseen
 * stories, then by most recent story. Within a group, stories are oldest-first
 * (reading order / progress-bar order).
 */
export async function getStoriesFeed(): Promise<StoryGroup[]> {
  const authUser = await getAuthUser();
  if (!authUser) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stories")
    .select(FEED_SELECT)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = (data ?? []) as unknown as DbFeedRow[];
  if (rows.length === 0) return [];

  const storyIds = rows.map((r) => r.id);

  const [views, likes, reposts] = await Promise.all([
    supabase
      .from("story_views")
      .select("story_id")
      .eq("viewer_id", authUser.id)
      .in("story_id", storyIds),
    supabase
      .from("story_likes")
      .select("story_id")
      .eq("liker_id", authUser.id)
      .in("story_id", storyIds),
    // The viewer's own reposts of these stories — drives the « repost / remove
    // repost » toggle so a story can only be reposted once.
    supabase
      .from("stories")
      .select("original_story_id")
      .eq("author_id", authUser.id)
      .eq("is_repost", true)
      .in("original_story_id", storyIds),
  ]);

  const seenIds = new Set((views.data ?? []).map((v) => v.story_id));
  const likedIds = new Set((likes.data ?? []).map((l) => l.story_id));
  const repostedIds = new Set(
    (reposts.data ?? []).map((r) => r.original_story_id),
  );

  // Group by author, preserving the oldest-first order within each group.
  const groups = new Map<string, StoryGroup>();
  for (const row of rows) {
    if (!row.author) continue;
    const story: StoryData = mapStoryFromDb(row, {
      seen: seenIds.has(row.id),
      likedByMe: likedIds.has(row.id),
      repostedByMe: repostedIds.has(row.id),
    });

    let group = groups.get(row.author_id);
    if (!group) {
      group = { author: row.author, stories: [], hasUnseen: false };
      groups.set(row.author_id, group);
    }
    group.stories.push(story);
    if (!story.seen) group.hasUnseen = true;
  }

  const latestOf = (g: StoryGroup) =>
    g.stories.reduce((max, s) => Math.max(max, s.createdAt), 0);

  return [...groups.values()].sort((a, b) => {
    // The viewer's own stories come first.
    const aIsSelf = a.stories[0]?.authorId === authUser.id;
    const bIsSelf = b.stories[0]?.authorId === authUser.id;
    if (aIsSelf !== bIsSelf) return aIsSelf ? -1 : 1;
    // Then groups with unseen stories, then most recent first.
    if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
    return latestOf(b) - latestOf(a);
  });
}
