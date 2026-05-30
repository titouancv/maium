import { getProfileBundle, getFollowInfo } from "@/lib/users";
import { ProfileFollowActions } from "./ProfileFollowActions";

/** Streamed follow counts + action buttons (round-trip 2). */
export async function ProfileFollowSection({ pseudo }: { pseudo: string }) {
  const [bundle, followInfo] = await Promise.all([
    getProfileBundle(pseudo),
    getFollowInfo(pseudo),
  ]);
  if (!bundle) return null;

  return (
    <ProfileFollowActions
      pseudo={pseudo}
      isOwner={bundle.isOwner}
      isAuthenticated={bundle.isAuthenticated}
      followInfo={followInfo}
    />
  );
}
