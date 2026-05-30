"use client";

import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/layout";

interface UserListContentProps {
  title: string;
  children: React.ReactNode;
}

/** Frame for follower/following lists; the list itself streams in as children. */
export function UserListContent({ title, children }: UserListContentProps) {
  const t = useTranslations("common");

  return (
    <PageLayout title={title} backLabel={t("backButton")}>
      <div className="w-full max-w-7xl">{children}</div>
    </PageLayout>
  );
}
