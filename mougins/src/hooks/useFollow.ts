"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { API, ROUTES } from "@/constants";

interface UseFollowOptions {
  pseudo: string;
  initialFollowing: boolean;
  initialCount?: number;
  isAuthenticated?: boolean;
}

export function useFollow({
  pseudo,
  initialFollowing,
  initialCount = 0,
  isAuthenticated = true,
}: UseFollowOptions) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    if (!isAuthenticated) {
      router.push(ROUTES.SIGNUP);
      return;
    }
    const next = !following;
    setFollowing(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const res = await fetch(API.USERS_FOLLOW, {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo }),
      });
      if (!res.ok) {
        setFollowing(!next);
        setCount((c) => c + (next ? -1 : 1));
      }
    });
  };

  return { following, count, toggle, isPending };
}
