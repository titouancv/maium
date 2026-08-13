import { getProfileBundle, getFollowInfo } from "@/lib/users";
import { ProfileFollowActions } from "./ProfileFollowActions";

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
      user={bundle.isOwner ? bundle.user : null}
    />
  );
}
