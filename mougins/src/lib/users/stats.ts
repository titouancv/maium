import { getUnreadNotificationsCount } from "./notifications";

export interface HomeStats {
  unreadNotificationsCount: number;
}

export async function getHomeStats(): Promise<HomeStats> {
  return { unreadNotificationsCount: await getUnreadNotificationsCount() };
}
