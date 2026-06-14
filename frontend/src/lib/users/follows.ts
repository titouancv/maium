import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/auth/getCurrentUser";
import type { UserSummary } from "@/types/user";

const SUMMARY_COLUMNS = "id, pseudo, first_name, last_name, location";

type SummaryRow = UserSummary & { id: string };
type FollowerRow = { follower: SummaryRow | null };
type FollowingRow = { followed: SummaryRow | null };

async function resolveTargetId(pseudo: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("id")
    .eq("pseudo", pseudo)
    .single();
  return data?.id ?? null;
}

function toRows(
  rows: (FollowerRow | FollowingRow)[],
  key: "follower" | "followed",
): SummaryRow[] {
  return rows
    .map((row) => (row as Record<typeof key, SummaryRow | null>)[key])
    .filter((user): user is SummaryRow => Boolean(user));
}

/**
 * Annotate each user with whether the current viewer follows them, so the list
 * can render an accurate follow/unfollow button. Strips the internal id.
 */
async function withFollowState(rows: SummaryRow[]): Promise<UserSummary[]> {
  const viewer = await getAuthUser();
  let followedSet = new Set<string>();
  if (viewer && rows.length > 0) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("user_follows")
      .select("followed_id")
      .eq("follower_id", viewer.id)
      .in(
        "followed_id",
        rows.map((row) => row.id),
      );
    followedSet = new Set((data ?? []).map((row) => row.followed_id as string));
  }
  return rows.map((row) => ({
    pseudo: row.pseudo,
    first_name: row.first_name,
    last_name: row.last_name,
    location: row.location,
    is_following: followedSet.has(row.id),
  }));
}

/** Users following `pseudo`. Returns `null` when the user does not exist. */
export async function getFollowers(
  pseudo: string,
): Promise<UserSummary[] | null> {
  const targetId = await resolveTargetId(pseudo);
  if (!targetId) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_follows")
    .select(`follower:follower_id(${SUMMARY_COLUMNS})`)
    .eq("followed_id", targetId);
  if (error) throw error;

  return withFollowState(
    toRows((data ?? []) as unknown as FollowerRow[], "follower"),
  );
}

/** Users that `pseudo` follows. Returns `null` when the user does not exist. */
export async function getFollowing(
  pseudo: string,
): Promise<UserSummary[] | null> {
  const targetId = await resolveTargetId(pseudo);
  if (!targetId) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_follows")
    .select(`followed:followed_id(${SUMMARY_COLUMNS})`)
    .eq("follower_id", targetId);
  if (error) throw error;

  return withFollowState(
    toRows((data ?? []) as unknown as FollowingRow[], "followed"),
  );
}
