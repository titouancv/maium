"use client";

import { useEffect, useRef, useState } from "react";
import { useLoadingStore } from "@/stores/useLoadingStore";
import { Title } from "../ui";

// visible       → monté, opacity-100
// transitioning → monté, opacity-0  (sortie uniquement)
// hidden        → non monté
type Phase = "hidden" | "transitioning" | "visible";

export function LoadingOverlay() {
  const suppressed = useLoadingStore((state) => state.suppressed);
  const [phase, setPhase] = useState<Phase>("visible");
  const timerA = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerB = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    clearTimeout(timerA.current!);
    clearTimeout(timerB.current!);

    if (suppressed) {
      timerA.current = setTimeout(() => setPhase("transitioning"), 0);
      timerB.current = setTimeout(() => setPhase("hidden"), 300);
    }

    return () => {
      clearTimeout(timerA.current!);
      clearTimeout(timerB.current!);
    };
  }, [suppressed]);

  if (phase === "hidden") return null;

  return (
    <div
      className={`bg-surface-50 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md transition-opacity duration-300 ${phase === "visible" ? "opacity-100" : "opacity-0"}`}
    >
      <Title label={"maium"} size="h1" />
    </div>
  );
}
