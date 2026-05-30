"use client";

import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/layout";
import { UserCard } from "@/components/ui";
import type { UserSummary } from "@/types";

interface UserListContentProps {
  users: UserSummary[];
  title: string;
  emptyMessage: string;
}

export function UserListContent({
  users,
  title,
  emptyMessage,
}: UserListContentProps) {
  const t = useTranslations("common");

  return (
    <PageLayout title={title} backLabel={t("backButton")}>
      <div className="w-full max-w-7xl">
        {users.length === 0 ? (
          <p className="text-txt-muted text-sm">{emptyMessage}</p>
        ) : (
          <ul>
            {users.map((user) => (
              <li key={user.pseudo}>
                <UserCard {...user} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageLayout>
  );
}
