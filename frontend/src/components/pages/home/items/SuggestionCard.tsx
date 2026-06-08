"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/constants";
import { Button, ProfilePhoto } from "@/components/ui";
import { useFollow } from "@/hooks";
import { useProfilePreviewStore } from "@/stores/useProfilePreviewStore";
import type { SuggestedUser } from "@/types";

interface SuggestionCardProps {
  user: SuggestedUser;
}

export const SuggestionCard = ({ user }: SuggestionCardProps) => {
  const t = useTranslations("home");
  const { following, toggle, isPending } = useFollow({
    pseudo: user.pseudo,
    initialFollowing: false,
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
        <ProfilePhoto pseudo={user.pseudo} />
        <div className="absolute right-2 bottom-0 left-2 flex flex-col">
          <p className="truncate leading-none">{user.first_name}</p>
          <p className="-mt-0.5 ml-2 truncate text-xl leading-none font-extrabold">
            {user.last_name}
          </p>
        </div>
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
