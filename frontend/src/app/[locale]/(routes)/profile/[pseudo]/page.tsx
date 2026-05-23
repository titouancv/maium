import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ProfileContent } from "@/components/content/ProfileContent";
import type { PublicUserData } from "@/types";

interface Props {
  params: Promise<{ pseudo: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { pseudo } = await params;

  const adminClient = createAdminClient();
  const { data: profileUser } = await adminClient
    .from("users")
    .select(
      "first_name, last_name, pseudo, dob, location, nationality, professional_experiences, educational_experiences, personal_experiences, social_networks, hobbies, skills, projects",
    )
    .eq("pseudo", pseudo)
    .single();

  if (!profileUser) notFound();

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let isOwner = false;
  if (authUser) {
    const { data: currentUser } = await supabase
      .from("users")
      .select("pseudo")
      .eq("id", authUser.id)
      .single();
    isOwner = currentUser?.pseudo === pseudo;
  }

  const userData: PublicUserData = {
    ...profileUser,
    dob: profileUser.dob
      ? new Date(profileUser.dob + "T00:00:00Z").getTime()
      : null,
  };

  return (
    <Suspense>
      <ProfileContent user={userData} isOwner={isOwner} />
    </Suspense>
  );
}
