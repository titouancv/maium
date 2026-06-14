import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/getCurrentUser";
import {
  mapFeedRowToStory,
  mapFeedRowToAuthor,
  type DbStoryFeedRow,
} from "@/lib/mappers/story";
import type { StoryData, StoryGroup } from "@/types/story";

/**
 * Stories visible to the current viewer (own + followed authors, non-expired),
 * grouped by author. The `get_stories_feed` RPC does all the data work in one
 * round trip: it re-applies the visibility + expiry rules and returns each story
 * already carrying the viewer's seen/liked/reposted flags and the denormalized
 * like/repost counts — so there is no fan-out of queries, no in-app tallying and
 * no service-role client here.
 *
 * Groups are ordered: the viewer's own stories first, then groups with unseen
 * stories, then by most recent story. Within a group, stories are oldest-first
 * (reading order / progress-bar order), as returned by the RPC.
 */
export async function getStoriesFeed(): Promise<StoryGroup[]> {
  const authUser = await getAuthUser();
  if (!authUser) return [];

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_stories_feed");
  if (error) throw error;

  const rows = (data ?? []) as DbStoryFeedRow[];
  if (rows.length === 0) return [];

  // Group by author, preserving the RPC's oldest-first order within each group.
  const groups = new Map<string, StoryGroup>();
  for (const row of rows) {
    const story: StoryData = mapFeedRowToStory(row);

    let group = groups.get(row.author_id);
    if (!group) {
      group = { author: mapFeedRowToAuthor(row), stories: [], hasUnseen: false };
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
