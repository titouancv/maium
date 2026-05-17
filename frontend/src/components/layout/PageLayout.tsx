"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ROUTES } from "@/constants";
import { Button, Title, Tabs } from "../ui";

interface PageLayoutProps {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  children: React.ReactNode;
}

export const PageLayout = ({
  title,
  onBack,
  backLabel,
  children,
}: PageLayoutProps) => {
  const router = useRouter();
  const t = useTranslations("nav");
  const handleBack = onBack ?? (() => router.back());

  useEffect(() => {
    document.title = title.toLowerCase() + " • maium";
  }, [title]);

  const tabs = [
    { name: t("home"), href: ROUTES.HOME },
    { name: t("settings"), href: ROUTES.SETTINGS },
  ];

  return (
    <div className="relative flex h-dvh flex-col md:h-screen md:items-center md:justify-center">
      <div className="flex h-full w-full flex-col gap-8 md:h-screen md:max-w-5xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between pt-12 md:pt-16">
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

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:bottom-14">
        <Tabs tabs={tabs} />
      </div>
    </div>
  );
};
