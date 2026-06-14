"use client";

import { useEffect } from "react";
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
  error,
  children,
}: FormLayoutProps) => {
  useEffect(() => {
    // Capture the current title so it can be restored on unmount — otherwise an
    // overlay rendered over a still-mounted page leaves the tab name stuck on
    // the overlay's title after it closes (the page's effect never re-runs).
    const previous = document.title;
    document.title = title.toLowerCase() + " • maium";
    return () => {
      document.title = previous;
    };
  }, [title]);

  return (
    <div className="flex h-dvh flex-col md:h-screen md:items-center md:justify-center">
      <div className="flex h-full w-full flex-col md:h-screen md:max-w-xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-4 pt-6 md:pt-12">
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
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-10 pb-4">
          {children}
        </div>

        {/* Buttons — inline on mobile and desktop */}
        {primaryLabel && (formId || onPrimary) && (
          <div className="shrink-0 px-4 pb-8 md:pb-[150px]">
            {error && <p className="text-error mb-2 text-sm">{error}</p>}
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
