"use client";

import { useEffect, useRef } from "react";
import { API } from "@/constants";

interface ProfileViewTrackerProps {
  /** The viewed profile's user id. */
  profileId: string;
}

/**
 * Fire-and-forget beacon that records a profile view once, on actual mount in
 * the browser. Because it runs from an effect, prefetched/streamed renders never
 * trigger it — only a real visit does. Dedup, self-view and anonymous filtering
 * all happen server-side in {@link API.USERS_VIEW}; this renders nothing.
 */
export const ProfileViewTracker = ({ profileId }: ProfileViewTrackerProps) => {
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;

    fetch(API.USERS_VIEW, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId }),
      keepalive: true,
    }).catch(() => {
      // Best-effort metric — a failed view record must never disrupt the page.
    });
  }, [profileId]);

  return null;
};
