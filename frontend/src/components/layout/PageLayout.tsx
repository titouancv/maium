"use client";

import { useEffect } from "react";
import { Title, NavigationBar, BackButton } from "../ui";

interface PageLayoutProps {
  /**
   * Header title. Pass a string for the default underlined `Title`, or a node
   * to stream the header (e.g. a `<Suspense>` boundary) — when a node is
   * provided it owns the full header row and `backLabel` is ignored.
   */
  title: React.ReactNode;
  /** Tab title; falls back to `title` when it is a string. */
  documentTitle?: string;
  onBack?: () => void;
  backLabel?: string;
  fullHeight?: boolean;
  showNavigationBar?: boolean;
  children: React.ReactNode;
}

export const PageLayout = ({
  title,
  documentTitle,
  onBack,
  backLabel,
  fullHeight = false,
  showNavigationBar = true,
  children,
}: PageLayoutProps) => {
  const tabTitle = documentTitle ?? (typeof title === "string" ? title : null);

  useEffect(() => {
    if (tabTitle) document.title = tabTitle.toLowerCase() + " • maium";
  }, [tabTitle]);

  return (
    <div className="relative flex h-dvh flex-col md:h-screen md:items-center">
      <div className="flex h-full w-full flex-col gap-6 md:h-screen md:gap-8">
        {/* Header */}
        <div className="flex shrink-0 justify-center px-4">
          <div className="flex w-full max-w-7xl shrink-0 items-center justify-between pt-6 md:pt-12">
            {typeof title === "string" ? (
              <>
                <Title label={title} size="h1" />
                {backLabel && <BackButton label={backLabel} onBack={onBack} />}
              </>
            ) : (
              title
            )}
          </div>
        </div>

        {/* Content */}

        <div className="flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto px-4">
          {children}
          {!fullHeight && <div className="h-24 shrink-0 md:h-32" />}
        </div>
      </div>

      <>
        <div className="absolute right-0 bottom-0 left-0 z-3 h-12 [mask-image:linear-gradient(to_top,black_20%,transparent)] backdrop-blur-sm" />
        {showNavigationBar && backLabel === undefined && (
          <div className="absolute bottom-8 left-1/2 z-4 -translate-x-1/2">
            <NavigationBar />
          </div>
        )}
      </>
    </div>
  );
};
