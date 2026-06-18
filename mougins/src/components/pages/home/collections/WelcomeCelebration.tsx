"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { WelcomeOverlay } from "./WelcomeOverlay";

interface WelcomeCelebrationProps {
  firstName: string;
}

/**
 * The onboarding celebration. The signup wizard hands off to the home page with
 * `?welcome=1` once onboarding is complete; that param is the single trigger for
 * the overlay (the `onboarding_completed` flag is already persisted). Entering
 * drops the param, fires confetti and fades the overlay out. Renders nothing
 * when the param is absent.
 */
export function WelcomeCelebration({ firstName }: WelcomeCelebrationProps) {
  const searchParams = useSearchParams();
  const welcome = searchParams.get("welcome") === "1";
  const [mounted, setMounted] = useState(welcome);
  const [visible, setVisible] = useState(welcome);

  if (!mounted) return null;

  const handleEnter = () => {
    // Drop ?welcome=1 so a refresh doesn't replay the celebration.
    window.history.replaceState(null, "", window.location.pathname);
    setVisible(false);
    import("canvas-confetti").then(({ default: confetti }) => {
      if (window.innerWidth >= 768) {
        confetti({
          particleCount: 120,
          angle: 45,
          spread: 90,
          origin: { x: 0, y: 1 },
          startVelocity: 50,
        });
        confetti({
          particleCount: 120,
          angle: 135,
          spread: 90,
          origin: { x: 1, y: 1 },
          startVelocity: 50,
        });
      } else {
        confetti({
          particleCount: 120,
          angle: 315,
          spread: 70,
          origin: { x: 0, y: 0 },
          startVelocity: 30,
          gravity: 0.7,
          scalar: 0.8,
        });
        confetti({
          particleCount: 120,
          angle: 225,
          spread: 70,
          origin: { x: 1, y: 0 },
          startVelocity: 30,
          gravity: 0.7,
          scalar: 0.8,
        });
      }
    });
    setTimeout(() => setMounted(false), 500);
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 p-4 transition-opacity duration-500",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <WelcomeOverlay firstName={firstName} onEnter={handleEnter} />
    </div>
  );
}
