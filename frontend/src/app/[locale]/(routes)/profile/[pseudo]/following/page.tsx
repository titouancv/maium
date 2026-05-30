import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getFollowing } from "@/lib/users";
import { UserListContent } from "@/components/user-list/UserListContent";
import { UserListItems } from "@/components/user-list/UserListItems";
import { UserListSkeleton } from "@/components/user-list/UserListSkeleton";

interface Props {
  params: Promise<{ pseudo: string }>;
}

export default async function FollowingPage({ params }: Props) {
  const { pseudo } = await params;
  const t = await getTranslations("profile");

  // Not awaited: streams into the list's Suspense boundary.
  const usersPromise = getFollowing(pseudo);

  return (
    <UserListContent title={t("followingTitle")}>
      <Suspense fallback={<UserListSkeleton />}>
        <UserListItems usersPromise={usersPromise} emptyMessage={t("noFollowing")} />
      </Suspense>
    </UserListContent>
  );
}
