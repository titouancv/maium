"use client";

import { useEffect } from "react";
import { LoadingOverlay } from "@/components/overlay/LoadingOverlay";
import { useLoadingStore } from "@/stores/useLoadingStore";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const timer = setTimeout(() => useLoadingStore.getState().suppress(), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {children}
      <LoadingOverlay />
    </>
  );
}
