"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { API, HOME_STATS_REFETCH_DEBOUNCE_MS } from "@/constants";
import type { HomeStats } from "@/lib/users";

/**
 * Live home dashboard stats. Seeds local state from the streamed server stats
 * (re-seeding whenever a client-side navigation streams fresh ones), then keeps
 * them current: a private per-user Realtime channel (`home-stats:<userId>`) is
 * pinged by DB triggers whenever something that affects this user's counters
 * changes — a follow/unfollow, a profile view, or a new message. Each ping
 * triggers a debounced refetch of the authoritative server stats (which the
 * server recomputes correctly); the channel is only a refresh trigger, never
 * the source of the numbers.
 *
 * Mirrors the messaging Realtime pattern, but scoped to its single reader
 * ([StatsRow]) via local state — no global store needed.
 */
export function useHomeStats(streamed: HomeStats, userId?: string): HomeStats {
  const [stats, setStats] = useState(streamed);
  const [seededFrom, setSeededFrom] = useState(streamed);

  // Re-seed when a client-side navigation streams fresh server stats. This is
  // React's "adjust state on prop change" pattern (setState during render, not
  // an effect), so a Realtime override survives until the next navigation.
  if (streamed !== seededFrom) {
    setSeededFrom(streamed);
    setStats(streamed);
  }

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
          setStats((await res.json()) as HomeStats);
        } catch {
          // Best-effort; the next ping or a navigation reconciles.
        }
      }, HOME_STATS_REFETCH_DEBOUNCE_MS);
    };

    // Private channels are gated by RLS on realtime.messages, so the socket must
    // carry the user's access token before subscribing.
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

  return stats;
}
