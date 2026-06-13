import { createAdminClient } from "@/lib/supabase/admin";
import type { StoryViewer } from "@/types/story";
import type { UserSummary } from "@/types/user";

const SUMMARY_COLUMNS = "pseudo, first_name, last_name, location";

type ViewerRow = { viewer_id: string; viewer: UserSummary | null };

/**
 * Users who have viewed `storyId`, most recent first, each flagged with whether
 * they also liked and/or reposted it. Returns `null` when the story does not
 * exist or `requesterId` is not its author — only an author may read who saw
 * their own story.
 *
 * Uses the admin client because `story_views` / `story_likes` RLS scope reads to
 * the viewer's own rows, and the embedded `users` summary is likewise not
 * publicly readable; ownership is enforced here before any row is returned.
 */
export async function getStoryViewers(
  storyId: string,
  requesterId: string,
): Promise<StoryViewer[] | null> {
  const admin = createAdminClient();

  const { data: story } = await admin
    .from("stories")
    .select("author_id")
    .eq("id", storyId)
    .single();
  if (!story || story.author_id !== requesterId) return null;

  // Viewers, plus who (among anyone) liked or reposted this story, fetched in
  // parallel and merged onto each viewer by user id. A repost is a story row
  // referencing the original via `original_story_id`.
  const [viewsRes, likesRes, repostsRes] = await Promise.all([
    admin
      .from("story_views")
      .select(`viewer_id, viewer:viewer_id(${SUMMARY_COLUMNS})`)
      .eq("story_id", storyId)
      // The author never counts as a viewer of their own story.
      .neq("viewer_id", requesterId)
      .order("created_at", { ascending: false }),
    admin.from("story_likes").select("liker_id").eq("story_id", storyId),
    admin
      .from("stories")
      .select("author_id")
      .eq("is_repost", true)
      .eq("original_story_id", storyId),
  ]);

  if (viewsRes.error) throw viewsRes.error;
  if (likesRes.error) throw likesRes.error;
  if (repostsRes.error) throw repostsRes.error;

  const likedBy = new Set(
    (likesRes.data ?? []).map((row) => (row as { liker_id: string }).liker_id),
  );
  const repostedBy = new Set(
    (repostsRes.data ?? []).map(
      (row) => (row as { author_id: string }).author_id,
    ),
  );

  return (viewsRes.data ?? [])
    .map((row) => row as unknown as ViewerRow)
    .filter((row): row is ViewerRow & { viewer: UserSummary } =>
      Boolean(row.viewer),
    )
    .map(({ viewer_id, viewer }) => ({
      ...viewer,
      liked: likedBy.has(viewer_id),
      reposted: repostedBy.has(viewer_id),
    }));
}
