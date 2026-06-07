import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/auth/getCurrentUser";
import { getUnreadConversationsCount } from "@/lib/messaging/server";

export interface HomeStats {
  followersCount: number;
  followingCount: number;
  unreadCount: number;
}

const EMPTY_STATS: HomeStats = {
  followersCount: 0,
  followingCount: 0,
  unreadCount: 0,
};

/**
 * Aggregate counters for the home dashboard's stats row: follower / following
 * totals for the current user plus their unread-conversation count, fetched in
 * parallel. Returns zeros when signed out.
 */
export async function getHomeStats(): Promise<HomeStats> {
  const authUser = await getAuthUser();
  if (!authUser) return EMPTY_STATS;

  const admin = createAdminClient();
  const [followers, following, unreadCount] = await Promise.all([
    admin
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("followed_id", authUser.id),
    admin
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", authUser.id),
    getUnreadConversationsCount(),
  ]);

  return {
    followersCount: followers.count ?? 0,
    followingCount: following.count ?? 0,
    unreadCount,
  };
}
