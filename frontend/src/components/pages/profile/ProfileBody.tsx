import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProfileBundle } from "@/lib/users";
import { getUserStoryGroup } from "@/lib/stories";
import { ProfileContent } from "./ProfileContent";
import { ProfileFollowSection } from "./ProfileFollowSection";
import { ProfileFollowSkeleton } from "./ProfileSkeleton";
import { ProfileViewTracker } from "./ProfileViewTracker";

/** Streamed profile body (round-trip 1) with the follow section nested (round-trip 2). */
export async function ProfileBody({ pseudo }: { pseudo: string }) {
  const bundle = await getProfileBundle(pseudo);
  if (!bundle) notFound();

  // Stream the profile's stories (round-trip 2, alongside the follow section):
  // the avatar paints immediately and gains the story ring when they resolve.
  const storiesPromise = bundle.isAuthenticated
    ? getUserStoryGroup(pseudo)
    : undefined;

  return (
    <>
      {bundle.isAuthenticated && !bundle.isOwner && (
        <ProfileViewTracker profileId={bundle.id} />
      )}
      <ProfileContent
        user={bundle.user}
        storiesPromise={storiesPromise}
        followSlot={
          <Suspense fallback={<ProfileFollowSkeleton />}>
            <ProfileFollowSection pseudo={pseudo} />
          </Suspense>
        }
      />
    </>
  );
}
