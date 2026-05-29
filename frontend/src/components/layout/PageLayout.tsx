"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button, Title, NavigationBar } from "../ui";

interface PageLayoutProps {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  fullHeight?: boolean;
  showNavigationBar?: boolean;
  children: React.ReactNode;
}

export const PageLayout = ({
  title,
  onBack,
  backLabel,
  fullHeight = false,
  showNavigationBar = true,
  children,
}: PageLayoutProps) => {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());

  useEffect(() => {
    document.title = title.toLowerCase() + " • maium";
  }, [title]);

  return (
    <div className="relative flex h-dvh flex-col md:h-screen md:items-center">
      <div className="flex h-full w-full flex-col gap-8 md:h-screen">
        {/* Header */}
        <div className="flex shrink-0 justify-center px-4">
          <div className="flex w-full max-w-7xl shrink-0 items-center justify-between pt-6 md:pt-12">
            <Title label={title} size="h1" />
            {backLabel && (
              <Button
                variant="ghost"
                type="button"
                size="none"
                onClick={handleBack}
              >
                {backLabel}
              </Button>
            )}
          </div>
        </div>

        {/* Content */}

        <div className="flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto px-4">
          {children}
          {!fullHeight && <div className="h-24 shrink-0 md:h-32" />}
        </div>
      </div>

      {showNavigationBar && (
        <>
          <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-12 [mask-image:linear-gradient(to_top,black_20%,transparent)] backdrop-blur-sm" />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <NavigationBar />
          </div>
        </>
      )}
    </div>
  );
};
