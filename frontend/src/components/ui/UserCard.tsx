"use client";

import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/constants";
import { useProfilePreviewStore } from "@/stores/useProfilePreviewStore";
import { ProfilePhoto } from "@/components/ui/ProfilePhoto";

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
}: UserCardProps) {
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

  if (onClick) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${defaultClassName} disabled:opacity-50`}
      >
        {content}
      </button>
    );
  }

  return (
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
}
