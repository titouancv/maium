"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { API, ROUTES } from "@/constants";
import { Button } from "@/components/ui";
import { useFollow } from "@/hooks";
import type { FollowInfo } from "@/lib/users";

interface ProfileFollowActionsProps {
  pseudo: string;
  isOwner: boolean;
  isAuthenticated: boolean;
  followInfo: FollowInfo;
}

export const ProfileFollowActions = ({
  pseudo,
  isOwner,
  isAuthenticated,
  followInfo,
}: ProfileFollowActionsProps) => {
  const t = useTranslations("profile");
  const tHome = useTranslations("home");
  const router = useRouter();
  const {
    following,
    count: followerCount,
    toggle: handleFollowToggle,
    isPending,
  } = useFollow({
    pseudo,
    initialFollowing: followInfo.isFollowing,
    initialCount: followInfo.followersCount,
    isAuthenticated,
  });
  const [isMessagePending, startMessageTransition] = useTransition();

  const handleMessage = () => {
    if (!isAuthenticated) {
      router.push(ROUTES.SIGNUP);
      return;
    }
    startMessageTransition(async () => {
      const res = await fetch(API.MESSAGES_CONVERSATIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPseudo: pseudo }),
      });
      if (res.ok) {
        const { conversationId } = await res.json();
        router.push(ROUTES.CONVERSATION(conversationId));
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <Link href={ROUTES.PROFILE_FOLLOWERS(pseudo)}>
          <Button variant="ghost" size="none" type="button" className="w-full">
            {t("followers", { count: followerCount })}
          </Button>
        </Link>
        <Link href={ROUTES.PROFILE_FOLLOWING(pseudo)}>
          <Button variant="ghost" size="none" type="button" className="w-full">
            {t("following", { count: followInfo.followingCount })}
          </Button>
        </Link>
      </div>
      {isOwner ? (
        <div className="flex flex-col gap-4">
          <Link href={ROUTES.JOBS}>
            <Button
              variant="primary"
              size="sm"
              type="button"
              className="w-full"
            >
              {tHome("goToAnalysis")}
            </Button>
          </Link>
          <Link href={ROUTES.SETTINGS}>
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="w-full"
            >
              {t("settingsButton")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Button
            variant={following ? "outline" : "primary"}
            size="sm"
            type="button"
            className="w-full"
            onClick={handleFollowToggle}
            disabled={isPending}
          >
            {following ? t("unfollowButton") : t("followButton")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            className="w-full"
            onClick={handleMessage}
            disabled={isMessagePending}
          >
            {t("messageButton")}
          </Button>
        </div>
      )}
    </div>
  );
};
