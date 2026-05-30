import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProfileBundle } from "@/lib/users";
import { ProfileContent } from "./ProfileContent";
import { ProfileFollowSection } from "./ProfileFollowSection";
import { ProfileFollowSkeleton } from "./ProfileSkeleton";

/** Streamed profile body (round-trip 1) with the follow section nested (round-trip 2). */
export async function ProfileBody({ pseudo }: { pseudo: string }) {
  const bundle = await getProfileBundle(pseudo);
  if (!bundle) notFound();

  return (
    <ProfileContent
      user={bundle.user}
      followSlot={
        <Suspense fallback={<ProfileFollowSkeleton />}>
          <ProfileFollowSection pseudo={pseudo} />
        </Suspense>
      }
    />
  );
}
