"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { API, HOME_STATS_REFETCH_DEBOUNCE_MS } from "@/constants";
import type { HomeStats } from "@/lib/users";

export function useHomeStats(streamed: HomeStats, userId?: string): HomeStats {
  const [stats, setStats] = useState(streamed);
  const [seededFrom, setSeededFrom] = useState(streamed);

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
        } catch {}
      }, HOME_STATS_REFETCH_DEBOUNCE_MS);
    };

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
