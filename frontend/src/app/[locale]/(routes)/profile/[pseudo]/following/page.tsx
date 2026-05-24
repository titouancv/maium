import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserListContent } from "@/components/content";

interface Props {
  params: Promise<{ pseudo: string }>;
}

export default async function FollowingPage({ params }: Props) {
  const { pseudo } = await params;
  const t = await getTranslations("profile");

  const admin = createAdminClient();
  const { data: target } = await admin.from("users").select("id").eq("pseudo", pseudo).single();
  if (!target) notFound();

  const { data } = await admin
    .from("user_follows")
    .select("followed:followed_id(pseudo, first_name, last_name, location)")
    .eq("follower_id", target.id);

  const users = (data ?? []).map((row: any) => row.followed).filter(Boolean);

  return (
    <UserListContent
      users={users}
      title={t("followingTitle")}
      emptyMessage={t("noFollowing")}
    />
  );
}
