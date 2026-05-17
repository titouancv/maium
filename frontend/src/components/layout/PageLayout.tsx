"use client";

import { useRouter } from "@/i18n/navigation";
import { Button, Title } from "../ui";

interface PageLayoutProps {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  children: React.ReactNode;
}

export const PageLayout = ({
  title,
  onBack,
  backLabel = "Back",
  children,
}: PageLayoutProps) => {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());

  return (
    <div className="flex h-dvh flex-col md:h-screen md:items-center md:justify-center">
      <div className="flex h-full w-full flex-col md:h-screen md:max-w-5xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between pt-16 md:pt-16">
          <Title label={title} size="h1" />
          <Button variant="ghost" type="button" size="sm" onClick={handleBack}>
            {backLabel}
          </Button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto pt-10 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
};
