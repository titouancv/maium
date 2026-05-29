import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProfileContent } from "@/components/profile";
import {
  mapUserFromDb,
  USER_PROFILE_SELECT,
  type DbUserRaw,
} from "@/lib/mappers/user";
import { getAuthUser, getCurrentUserProfile } from "@/lib/auth/getCurrentUser";
import type { PublicUserData } from "@/types";

interface Props {
  params: Promise<{ pseudo: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { pseudo } = await params;
  const adminClient = createAdminClient();

  // Round-trip 1: profile lookup + current user (deduped with layout via cache)
  const [profileResult, authUser, currentUser] = await Promise.all([
    adminClient
      .from("users")
      .select(
        `id, first_name, last_name, pseudo, dob, location, nationality, bio, ${USER_PROFILE_SELECT}`,
      )
      .eq("pseudo", pseudo)
      .single(),
    getAuthUser(),
    getCurrentUserProfile(),
  ]);

  const profileRaw = profileResult.data as (DbUserRaw & { id: string }) | null;
  if (!profileRaw) notFound();

  const isOwner = currentUser?.pseudo === pseudo;

  // Round-trip 2: all follow counts in parallel
  const [followersResult, followingResult, isFollowingResult] =
    await Promise.all([
      adminClient
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("followed_id", profileRaw.id),
      adminClient
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profileRaw.id),
      authUser && !isOwner
        ? adminClient
            .from("user_follows")
            .select("*", { count: "exact", head: true })
            .eq("follower_id", authUser.id)
            .eq("followed_id", profileRaw.id)
        : Promise.resolve({ count: 0 }),
    ]);

  const full = mapUserFromDb(profileRaw);
  const userData: PublicUserData = {
    first_name: full.first_name,
    last_name: full.last_name,
    pseudo: full.pseudo,
    dob: full.dob,
    location: full.location,
    nationality: full.nationality,
    bio: full.bio,
    professional_experiences: full.professional_experiences,
    educational_experiences: full.educational_experiences,
    personal_experiences: full.personal_experiences,
    social_networks: full.social_networks,
    hobbies: full.hobbies,
    skills: full.skills,
    projects: full.projects,
    followers_count: followersResult.count ?? 0,
    following_count: followingResult.count ?? 0,
  };

  const isFollowing =
    !!authUser && !isOwner && (isFollowingResult.count ?? 0) > 0;

  return (
    <Suspense>
      <ProfileContent
        user={userData}
        isOwner={isOwner}
        isFollowing={isFollowing}
        isAuthenticated={!!authUser}
      />
    </Suspense>
  );
}
