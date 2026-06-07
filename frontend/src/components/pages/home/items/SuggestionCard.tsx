"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/constants";
import { Button } from "@/components/ui";
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

  const displayName = `${user.first_name} ${user.last_name}`;

  return (
    <div className="bg-surface-100 border-brd-200 flex h-full w-44 shrink-0 flex-col gap-3 rounded-2xl border p-4">
      <Link
        href={ROUTES.PROFILE(user.pseudo)}
        // Seed the profile name so the target page paints its title instantly.
        onClick={() =>
          useProfilePreviewStore.getState().setPreview({
            pseudo: user.pseudo,
            first_name: user.first_name,
            last_name: user.last_name,
          })
        }
        className="hover:text-primary min-w-0 flex-1"
      >
        <p className="truncate font-medium">{displayName}</p>
        <p className="text-txt-muted truncate text-xs">@{user.pseudo}</p>
        <p className="text-txt-muted mt-2 text-xs">
          {t("suggestions.followersCount", { count: user.followers_count })}
        </p>
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
