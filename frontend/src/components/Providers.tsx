"use client";

import { useEffect } from "react";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { useLoadingStore } from "@/stores/useLoadingStore";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      useLoadingStore.getState().increment();
      try {
        return await originalFetch(...args);
      } finally {
        useLoadingStore.getState().decrement();
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <>
      {children}
      <LoadingOverlay />
    </>
  );
}
