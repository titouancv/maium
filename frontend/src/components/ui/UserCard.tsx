"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/constants";
import { useProfilePreviewStore } from "@/stores/useProfilePreviewStore";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { ProfilePhoto } from "@/components/ui/ProfilePhoto";
import { Button } from "@/components/ui/Button";
import { useFollow } from "@/hooks";

interface UserCardProps {
  pseudo: string;
  first_name: string;
  last_name: string;
  location?: string | null;
  subtitle?: string | null;
  subtitleClassName?: string;
  /** Uploaded photo URL; falls back to a default derived from `pseudo`. */
  profilePhoto?: string | null;
  href?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Show an optional follow/unfollow button at the end of the row. */
  showFollow?: boolean;
  /** Initial following state for the optional follow button. */
  initialFollowing?: boolean;
}

function FollowButton({
  pseudo,
  initialFollowing,
}: {
  pseudo: string;
  initialFollowing: boolean;
}) {
  const t = useTranslations("profile");
  const { following, toggle, isPending } = useFollow({
    pseudo,
    initialFollowing,
  });

  return (
    <Button
      variant={following ? "outline" : "primary"}
      size="sm"
      type="button"
      className="shrink-0 self-center"
      onClick={toggle}
      disabled={isPending}
    >
      {following ? t("unfollowButton") : t("followButton")}
    </Button>
  );
}

export function UserCard({
  pseudo,
  first_name,
  last_name,
  location,
  subtitle,
  subtitleClassName,
  profilePhoto,
  href,
  className,
  onClick,
  disabled,
  showFollow,
  initialFollowing,
}: UserCardProps) {
  const isSelf = useCurrentUserStore((s) => s.user?.pseudo === pseudo);
  const displayName = `${first_name} ${last_name}`;
  const secondLine =
    subtitle ?? (location ? `@${pseudo} • ${location}` : `@${pseudo}`);

  const defaultClassName =
    className ?? "text-txt hover:text-primary flex w-full gap-2 py-3";

  const content = (
    <>
      <ProfilePhoto
        pseudo={pseudo}
        src={profilePhoto}
        sizes="40px"
        className="h-10 w-auto self-center"
      />
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate font-extrabold">{displayName}</p>
        <p
          className={`truncate text-xs ${subtitleClassName ?? "text-txt-muted"}`}
        >
          {secondLine}
        </p>
      </div>
    </>
  );

  const trigger = onClick ? (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${defaultClassName} disabled:opacity-50`}
    >
      {content}
    </button>
  ) : (
    <Link
      href={href ?? ROUTES.PROFILE(pseudo)}
      className={defaultClassName}
      // Seed the profile name so the target page can paint its title instantly.
      onClick={() =>
        useProfilePreviewStore
          .getState()
          .setPreview({ pseudo, first_name, last_name })
      }
    >
      {content}
    </Link>
  );

  // The follow button is interactive, so it must sit beside the link/button
  // trigger (never nested inside it) to keep the markup valid. Hidden on the
  // current user's own card — you can't follow yourself.
  if (showFollow && !isSelf) {
    return (
      <div className="flex w-full items-center gap-2">
        {trigger}
        <FollowButton
          pseudo={pseudo}
          initialFollowing={initialFollowing ?? false}
        />
      </div>
    );
  }

  return trigger;
}
