import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getFollowing } from "@/lib/users";
import { UserListContent } from "@/components/user-list";

interface Props {
  params: Promise<{ pseudo: string }>;
}

export default async function FollowingPage({ params }: Props) {
  const { pseudo } = await params;
  const t = await getTranslations("profile");

  const users = await getFollowing(pseudo);
  if (users === null) notFound();

  return (
    <UserListContent
      users={users}
      title={t("followingTitle")}
      emptyMessage={t("noFollowing")}
    />
  );
}
