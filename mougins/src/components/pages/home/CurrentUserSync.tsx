"use client";

import { useLayoutEffect } from "react";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import type { UserData } from "@/types";

interface CurrentUserSyncProps {
  user: UserData | null;
}

/**
 * Keeps the global current-user store in sync with the freshest server data.
 * The layout's [UserHydration] only runs on a full load, so after a client-side
 * navigation to the home page (e.g. finishing signup) the store would otherwise
 * stay stale and the nav tabs (pseudo) wouldn't appear until a hard refresh.
 * Render-only side effect — emits no UI.
 */
export function CurrentUserSync({ user }: CurrentUserSyncProps) {
  useLayoutEffect(() => {
    useCurrentUserStore.getState().setUser(user);
  }, [user]);

  return null;
}
