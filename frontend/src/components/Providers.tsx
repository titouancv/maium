"use client";

import { useEffect } from "react";
import { LoadingOverlay } from "@/components/ui";
import { useLoadingStore } from "@/stores/useLoadingStore";
import { ThemeApplier } from "@/components/ThemeApplier";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const timer = setTimeout(() => useLoadingStore.getState().suppress(), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <ThemeApplier />
      {children}
      <LoadingOverlay />
    </>
  );
}
