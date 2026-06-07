import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/auth/getCurrentUser";
import { getUnreadConversationsCount } from "@/lib/messaging/server";

export interface HomeStats {
  followersCount: number;
  followingCount: number;
  unreadCount: number;
  /**
   * Absolute net follower change over the last 7 days, computed from the
   * `follower_events` log (follows +1 / unfollows -1), so it can be negative
   * (e.g. +1 for a first follower, -2 for net losses). `null` when there was
   * no net change at all over the window.
   */
  followersTrend: number | null;
}

const TREND_WINDOW_DAYS = 7;

const EMPTY_STATS: HomeStats = {
  followersCount: 0,
  followingCount: 0,
  unreadCount: 0,
  followersTrend: null,
};

/**
 * Aggregate counters for the home dashboard's stats row: follower / following
 * totals for the current user plus their unread-conversation count, fetched in
 * parallel. Returns zeros when signed out.
 */
export async function getHomeStats(): Promise<HomeStats> {
  const authUser = await getAuthUser();
  if (!authUser) return EMPTY_STATS;

  const windowStart = new Date(
    Date.now() - TREND_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const admin = createAdminClient();
  const [followers, following, netChange, unreadCount] = await Promise.all([
    admin
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("followed_id", authUser.id),
    admin
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", authUser.id),
    admin.rpc("get_follower_net_change", {
      p_user_id: authUser.id,
      p_since: windowStart,
    }),
    getUnreadConversationsCount(),
  ]);

  // Absolute net follows minus unfollows over the window (e.g. +1 / -2);
  // hidden (null) when there was no net movement.
  const followersCount = followers.count ?? 0;
  const followersNetChange = (netChange.data as number | null) ?? 0;
  const followersTrend = followersNetChange !== 0 ? followersNetChange : null;

  return {
    followersCount,
    followingCount: following.count ?? 0,
    unreadCount,
    followersTrend,
  };
}
