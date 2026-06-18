"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/constants";
import { Button, ProfilePhoto } from "@/components/ui";
import { useFollow } from "@/hooks";
import { useProfilePreviewStore } from "@/stores/useProfilePreviewStore";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import type { SuggestedUser } from "@/types";

interface SuggestionCardProps {
  user: SuggestedUser;
}

export const SuggestionCard = ({ user }: SuggestionCardProps) => {
  const t = useTranslations("home");
  // Signed-out visitors see this card on the public home page; toggling follow
  // then redirects to signup instead of firing an unauthenticated request.
  const isAuthenticated = useCurrentUserStore((s) => !!s.user?.id);
  const { following, toggle, isPending } = useFollow({
    pseudo: user.pseudo,
    initialFollowing: false,
    isAuthenticated,
  });

  return (
    <div className="flex h-full w-44 shrink-0 flex-col gap-3">
      <Link
        href={ROUTES.PROFILE(user.pseudo)}
        onClick={() =>
          useProfilePreviewStore.getState().setPreview({
            pseudo: user.pseudo,
            first_name: user.first_name,
            last_name: user.last_name,
          })
        }
        className="hover:text-primary relative min-w-0 flex-1"
      >
        <ProfilePhoto
          pseudo={user.pseudo}
          src={user.profile_photo}
          displayName={{ firstName: user.first_name, lastName: user.last_name }}
        />
      </Link>
      <Button
        variant={following ? "outline" : "primary"}
        size="sm"
        type="button"
        className="w-full"
        onClick={toggle}
        disabled={isPending}
      >
        {following ? t("suggestions.following") : t("suggestions.follow")}
      </Button>
    </div>
  );
};
