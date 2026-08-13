import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProfileBundle } from "@/lib/users";
import { ProfileContent } from "./ProfileContent";
import { ProfileFollowSection } from "./ProfileFollowSection";
import { ProfileRank } from "./ProfileRank";
import { ProfileFollowSkeleton } from "./ProfileSkeleton";
import { ProfileViewTracker } from "./ProfileViewTracker";

export async function ProfileBody({ pseudo }: { pseudo: string }) {
  const bundle = await getProfileBundle(pseudo);
  if (!bundle) notFound();

  return (
    <>
      {bundle.isAuthenticated && !bundle.isOwner && (
        <ProfileViewTracker profileId={bundle.id} />
      )}
      <ProfileContent
        user={bundle.user}
        rankSlot={
          <Suspense fallback={null}>
            <ProfileRank pseudo={pseudo} />
          </Suspense>
        }
        followSlot={
          <Suspense fallback={<ProfileFollowSkeleton />}>
            <ProfileFollowSection pseudo={pseudo} />
          </Suspense>
        }
      />
    </>
  );
}
