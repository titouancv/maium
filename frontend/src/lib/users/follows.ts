import { createAdminClient } from "@/lib/supabase/admin";
import type { UserSummary } from "@/types/user";

const SUMMARY_COLUMNS = "pseudo, first_name, last_name, location";

type FollowerRow = { follower: UserSummary | null };
type FollowingRow = { followed: UserSummary | null };

async function resolveTargetId(pseudo: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("id")
    .eq("pseudo", pseudo)
    .single();
  return data?.id ?? null;
}

function toUsers(
  rows: (FollowerRow | FollowingRow)[],
  key: "follower" | "followed",
): UserSummary[] {
  return rows
    .map((row) => (row as Record<typeof key, UserSummary | null>)[key])
    .filter((user): user is UserSummary => Boolean(user));
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

  return toUsers((data ?? []) as unknown as FollowerRow[], "follower");
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

  return toUsers((data ?? []) as unknown as FollowingRow[], "followed");
}
