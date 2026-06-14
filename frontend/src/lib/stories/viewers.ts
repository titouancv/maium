import { createClient } from "@/lib/supabase/server";
import type { StoryViewer } from "@/types/story";

type ViewerRow = {
  pseudo: string;
  first_name: string;
  last_name: string;
  location: string | null;
  liked: boolean;
  reposted: boolean;
};

/**
 * Users who have viewed `storyId`, most recent first, each flagged with whether
 * they also liked and/or reposted it. Returns `null` when the caller is not the
 * story's author or the story does not exist.
 *
 * The `get_story_viewers` RPC (SECURITY DEFINER) does both the author check and
 * the cross-RLS reads (other viewers' rows + their user summaries) in one call,
 * so no service-role client is needed here. A non-author / missing story makes
 * the RPC raise `insufficient_privilege`, surfaced as PostgREST error `42501`.
 */
export async function getStoryViewers(
  storyId: string,
): Promise<StoryViewer[] | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_story_viewers", {
    p_story_id: storyId,
  });

  if (error) {
    if (error.code === "42501") return null; // not the author / story missing
    throw error;
  }

  return ((data ?? []) as ViewerRow[]).map(
    ({ pseudo, first_name, last_name, location, liked, reposted }) => ({
      pseudo,
      first_name,
      last_name,
      location,
      liked,
      reposted,
    }),
  );
}
