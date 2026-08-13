"use client";

import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/layout";

interface UserListContentProps {
  title: string;
  children: React.ReactNode;
}

export function UserListContent({ title, children }: UserListContentProps) {
  const t = useTranslations("common");

  return (
    <PageLayout title={title} backLabel={t("backButton")}>
      <div className="w-full max-w-2xl">{children}</div>
    </PageLayout>
  );
}
