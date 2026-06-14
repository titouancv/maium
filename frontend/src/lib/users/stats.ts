import { getUnreadNotificationsCount } from "./notifications";

export interface HomeStats {
  /**
   * Number of unread notifications (new followers, messages and profile views),
   * powering the home dashboard's single "Notifications" card. Read from the
   * `public.notifications` log; see {@link getUnreadNotificationsCount}.
   */
  unreadNotificationsCount: number;
}

/**
 * Counters for the home dashboard's notifications card. Gates on the
 * authenticated user (returns 0 when signed out).
 */
export async function getHomeStats(): Promise<HomeStats> {
  return { unreadNotificationsCount: await getUnreadNotificationsCount() };
}
