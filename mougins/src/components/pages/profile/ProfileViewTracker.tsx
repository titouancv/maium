"use client";

import { useEffect, useRef } from "react";
import { API } from "@/constants";

interface ProfileViewTrackerProps {
  profileId: string;
}

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
    }).catch(() => {});
  }, [profileId]);

  return null;
};
