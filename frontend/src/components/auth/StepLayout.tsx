"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Title, StepCounter } from "@/components/ui";
import { Button } from "@/components/ui/Button";

interface StepLayoutProps {
  title: string;
  step: number;
  totalSteps?: number;
  formId?: string;
  onBack?: () => void;
  backLabel?: string;
  nextLabel?: string;
  children: React.ReactNode;
}

export const StepLayout = ({
  title,
  step,
  totalSteps = 4,
  formId,
  onBack,
  backLabel,
  nextLabel,
  children,
}: StepLayoutProps) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      const kbHeight = Math.max(
        0,
        window.innerHeight - viewport.offsetTop - viewport.height,
      );
      setKeyboardHeight(kbHeight);
    };

    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div className="flex min-h-dvh flex-col md:min-h-screen md:items-center md:justify-center md:px-0">
      <div className="flex w-full flex-col md:min-h-screen md:max-w-md">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between pt-16 md:pt-[200px]">
          <Title label={title} size="h1" />
          <StepCounter step={step} totalSteps={totalSteps} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pt-10 pb-32 text-xl md:flex md:items-center md:justify-center md:overflow-visible md:pt-0 md:pb-0">
          <div className="w-full md:max-w-md">{children}</div>
        </div>

        {/* Buttons — fixed above keyboard on mobile, inline on desktop */}
        {formId && nextLabel && (
          <div
            className={cn(
              "fixed inset-x-0 px-6 transition-[bottom] duration-300",
              "md:static md:inset-auto md:px-0 md:pb-[200px]",
              keyboardHeight > 0 ? "pb-4" : "pb-8",
            )}
            style={{
              bottom:
                keyboardHeight > 0
                  ? keyboardHeight
                  : "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div className="flex gap-2 md:mt-4">
              {onBack && (
                <Button
                  variant="outline"
                  type="button"
                  onClick={onBack}
                  size="lg"
                  className="w-full"
                >
                  {backLabel}
                </Button>
              )}
              <Button type="submit" form={formId} size="lg" className="w-full">
                {nextLabel}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
