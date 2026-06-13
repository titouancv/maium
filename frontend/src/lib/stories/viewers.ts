import { createAdminClient } from "@/lib/supabase/admin";
import type { UserSummary } from "@/types/user";

const SUMMARY_COLUMNS = "pseudo, first_name, last_name, location";

type ViewerRow = { viewer: UserSummary | null };

/**
 * Users who have viewed `storyId`, most recent first. Returns `null` when the
 * story does not exist or `requesterId` is not its author — only an author may
 * read who saw their own story.
 *
 * Uses the admin client because `story_views` RLS scopes reads to the viewer's
 * own rows, and the embedded `users` summary is likewise not publicly readable;
 * ownership is enforced here before any row is returned.
 */
export async function getStoryViewers(
  storyId: string,
  requesterId: string,
): Promise<UserSummary[] | null> {
  const admin = createAdminClient();

  const { data: story } = await admin
    .from("stories")
    .select("author_id")
    .eq("id", storyId)
    .single();
  if (!story || story.author_id !== requesterId) return null;

  const { data, error } = await admin
    .from("story_views")
    .select(`viewer:viewer_id(${SUMMARY_COLUMNS})`)
    .eq("story_id", storyId)
    // The author never counts as a viewer of their own story.
    .neq("viewer_id", requesterId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? [])
    .map((row) => (row as unknown as ViewerRow).viewer)
    .filter((user): user is UserSummary => Boolean(user));
}
