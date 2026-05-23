"use client";

import { use, useLayoutEffect } from "react";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import type { UserData } from "@/types";

export function UserHydration({
  userPromise,
}: {
  userPromise: Promise<UserData | null>;
}) {
  const user = use(userPromise);

  useLayoutEffect(() => {
    useCurrentUserStore.getState().setUser(user);
  }, [user]);

  return null;
}
