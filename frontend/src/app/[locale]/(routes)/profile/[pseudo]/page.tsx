import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ProfileContent } from "@/components/content/ProfileContent";
import { mapUserFromDb, USER_PROFILE_SELECT, type DbUserRaw } from "@/lib/mappers/user";
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
      `first_name, last_name, pseudo, dob, location, nationality, ${USER_PROFILE_SELECT}`,
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

  const full = mapUserFromDb(profileUser as unknown as DbUserRaw);
  const userData: PublicUserData = {
    first_name: full.first_name,
    last_name: full.last_name,
    pseudo: full.pseudo,
    dob: full.dob,
    location: full.location,
    nationality: full.nationality,
    professional_experiences: full.professional_experiences,
    educational_experiences: full.educational_experiences,
    personal_experiences: full.personal_experiences,
    social_networks: full.social_networks,
    hobbies: full.hobbies,
    skills: full.skills,
    projects: full.projects,
  };

  return (
    <Suspense>
      <ProfileContent user={userData} isOwner={isOwner} />
    </Suspense>
  );
}
