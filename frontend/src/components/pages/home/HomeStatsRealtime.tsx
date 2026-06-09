"use client";

import { useEffect } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { API, HOME_STATS_REFETCH_DEBOUNCE_MS } from "@/constants";
import { useHomeStatsStore } from "@/stores/useHomeStatsStore";
import type { HomeStats } from "@/lib/users";

interface HomeStatsRealtimeProps {
  /** The current user's auth id — the private channel is scoped to it. */
  userId: string;
}

/**
 * Live home dashboard stats. A private per-user Realtime channel
 * (`home-stats:<userId>`) is pinged by DB triggers whenever something that
 * affects this user's counters changes — a follow/unfollow, a profile view, or
 * a new message in one of their conversations. Each ping triggers a debounced
 * refetch of the authoritative server stats (which the server recomputes
 * correctly: trend nullability, distinct viewers, unread logic); the channel is
 * only a trigger to refresh, never the source of the numbers.
 *
 * Mirrors [MessagingRealtime]: a single subscription writing into a store that
 * the rendered cards ([StatsRow] via [useHomeStatsStore]) read from.
 */
export function HomeStatsRealtime({ userId }: HomeStatsRealtimeProps) {
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    let channel: RealtimeChannel | undefined;
    let cancelled = false;
    let refetchTimer: ReturnType<typeof setTimeout> | null = null;

    const refresh = () => {
      if (refetchTimer) clearTimeout(refetchTimer);
      refetchTimer = setTimeout(async () => {
        try {
          const res = await fetch(API.HOME_STATS);
          if (!res.ok) return;
          const stats = (await res.json()) as HomeStats;
          useHomeStatsStore.getState().setStats(stats);
        } catch {
          // Best-effort; the next ping or a navigation reconciles.
        }
      }, HOME_STATS_REFETCH_DEBOUNCE_MS);
    };

    // Private channels are gated by RLS on realtime.messages, so the realtime
    // socket must carry the user's access token before subscribing.
    (async () => {
      await supabase.realtime.setAuth();
      if (cancelled) return;
      channel = supabase
        .channel(`home-stats:${userId}`, { config: { private: true } })
        .on("broadcast", { event: "stats:refresh" }, refresh)
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (refetchTimer) clearTimeout(refetchTimer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId]);

  return null;
}
