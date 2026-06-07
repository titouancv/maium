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
        className="hover:text-primary min-w-0 flex-1"
      >
        <p className="truncate text-sm leading-tight font-medium">
          {user.first_name}
        </p>
        <p className="ml-2 truncate text-xl leading-tight font-extrabold">
          {user.last_name}
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
