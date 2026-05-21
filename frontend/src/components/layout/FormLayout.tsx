"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Title, StepCounter } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { FormBaseProps } from "../form/Form";

interface FormLayoutProps extends Omit<FormBaseProps, "title"> {
  title: string;
  children: React.ReactNode;
}

export const FormLayout = ({
  title,
  step,
  totalSteps,
  isCancelable,
  onCancel,
  cancelLabel,
  formId,
  onPrimary,
  onSecondary,
  secondaryLabel,
  primaryLabel,
  primaryLoading,
  children,
}: FormLayoutProps) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    document.title = title.toLowerCase() + " • maium";
  }, [title]);

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
    <div className="flex h-dvh flex-col p-4 md:h-screen md:items-center md:justify-center">
      <div className="flex h-full w-full flex-col md:h-screen md:max-w-xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between pt-6 md:pt-12">
          <Title label={title} size="h1" />
          {isCancelable ? (
            <Button
              variant="ghost"
              type="button"
              size="none"
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
          ) : (
            <StepCounter step={step} totalSteps={totalSteps} />
          )}
        </div>

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-10 pb-18 md:pb-4">
          {children}
        </div>

        {/* Buttons — fixed above keyboard on mobile, inline on desktop */}
        {primaryLabel && (formId || onPrimary) && (
          <div
            className={cn(
              "fixed inset-x-0 px-4 transition-[bottom] duration-300",
              "md:static md:inset-auto md:px-0 md:pb-[150px]",
              keyboardHeight > 0 ? "pb-4" : "pb-8",
            )}
            style={{
              bottom:
                keyboardHeight > 0
                  ? keyboardHeight
                  : "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div className="flex gap-2">
              {onSecondary && (
                <Button
                  variant="outline"
                  type="button"
                  onClick={onSecondary}
                  size="lg"
                  className="w-full"
                >
                  {secondaryLabel}
                </Button>
              )}
              <Button
                type={formId ? "submit" : "button"}
                form={formId}
                size="lg"
                className="w-full"
                isLoading={primaryLoading}
                onClick={!formId ? onPrimary : undefined}
              >
                {primaryLabel}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
