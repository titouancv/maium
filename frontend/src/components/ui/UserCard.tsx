"use client";

import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/constants";
import { useProfilePreviewStore } from "@/stores/useProfilePreviewStore";

interface UserCardProps {
  pseudo: string;
  first_name: string;
  last_name: string;
  location?: string | null;
  subtitle?: string | null;
  subtitleClassName?: string;
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
    <div className="min-w-0 flex-1 text-left">
      <p className="truncate">{displayName}</p>
      <p
        className={`truncate text-xs ${subtitleClassName ?? "text-txt-muted"}`}
      >
        {secondLine}
      </p>
    </div>
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
