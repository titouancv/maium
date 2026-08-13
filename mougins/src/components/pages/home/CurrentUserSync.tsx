"use client";

import { useLayoutEffect } from "react";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import type { UserData } from "@/types";

interface CurrentUserSyncProps {
  user: UserData | null;
}

export function CurrentUserSync({ user }: CurrentUserSyncProps) {
  useLayoutEffect(() => {
    useCurrentUserStore.getState().setUser(user);
  }, [user]);

  return null;
}
