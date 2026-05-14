"use client";

import { useEffect, useRef, useState } from "react";
import { useLoadingStore } from "@/stores/useLoadingStore";

// hidden        → non monté
// transitioning → monté, opacity-0  (entrée ou sortie)
// visible       → monté, opacity-100
type Phase = "hidden" | "transitioning" | "visible";

export function LoadingOverlay() {
  const count = useLoadingStore((state) => state.count);
  const [phase, setPhase] = useState<Phase>("hidden");
  const timerA = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerB = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    clearTimeout(timerA.current!);
    clearTimeout(timerB.current!);

    if (count > 0) {
      // Après 1s : monter avec opacity-0, puis fondu entrant en 300ms
      timerA.current = setTimeout(() => {
        setPhase("transitioning");
        timerB.current = setTimeout(() => setPhase("visible"), 16);
      }, 1000);
    } else {
      // Fondu sortant : opacity-0, puis démonter après 350ms
      timerA.current = setTimeout(() => {
        setPhase("transitioning");
        timerB.current = setTimeout(() => setPhase("hidden"), 350);
      }, 0);
    }

    return () => {
      clearTimeout(timerA.current!);
      clearTimeout(timerB.current!);
    };
  }, [count]);

  if (phase === "hidden") return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-surface-50/20 transition-opacity duration-300 ${phase === "visible" ? "opacity-100" : "opacity-0"}`}
    >
      <span className="text-txt text-2xl font-bold">maium</span>
    </div>
  );
}
