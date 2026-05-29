import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserListContent } from "@/components/user-list";

interface Props {
  params: Promise<{ pseudo: string }>;
}

export default async function FollowersPage({ params }: Props) {
  const { pseudo } = await params;
  const t = await getTranslations("profile");

  const admin = createAdminClient();
  const { data: target } = await admin.from("users").select("id").eq("pseudo", pseudo).single();
  if (!target) notFound();

  const { data } = await admin
    .from("user_follows")
    .select("follower:follower_id(pseudo, first_name, last_name, location)")
    .eq("followed_id", target.id);

  const users = (data ?? []).map((row: any) => row.follower).filter(Boolean);

  return (
    <UserListContent
      users={users}
      title={t("followersTitle")}
      emptyMessage={t("noFollowers")}
    />
  );
}
