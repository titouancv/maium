import { create } from "zustand";
import type { HomeStats } from "@/lib/users";

interface HomeStatsStore {
  /**
   * Live home dashboard counters. Seeded by [StatsRow] from the streamed server
   * stats and refreshed by [HomeStatsRealtime] on each Realtime ping. `null`
   * until the first seed (the card then falls back to its streamed value).
   */
  stats: HomeStats | null;
  setStats: (stats: HomeStats) => void;
}

/**
 * In-memory cache holding the freshest home stats so a DB-triggered Realtime
 * refresh updates the cards in place, across the [StatsRow] Suspense boundary,
 * without prop-drilling. The streamed server data stays authoritative.
 */
export const useHomeStatsStore = create<HomeStatsStore>((set) => ({
  stats: null,
  setStats: (stats) => set({ stats }),
}));
