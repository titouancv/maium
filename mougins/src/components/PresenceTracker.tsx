"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { usePresenceStore } from "@/stores/usePresenceStore";

const PRESENCE_CHANNEL = "presence:online";

export function PresenceTracker() {
  const userId = useCurrentUserStore((s) => s.user?.id);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: userId } },
    });

    const sync = () => {
      const state = channel.presenceState();
      usePresenceStore.getState().setOnline(Object.keys(state));
    };

    channel
      .on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      usePresenceStore.getState().setOnline([]);
    };
  }, [userId]);

  return null;
}
