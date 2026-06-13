import Image from "next/image";
import {
  DEFAULT_PROFILE_PHOTO,
  DEFAULT_PROFILE_PHOTO_COUNT,
} from "@/constants";
import { cn } from "@/lib/utils";

interface ProfilePhotoProps {
  pseudo: string;
  displayName?: { firstName: string; lastName: string };
  src?: string | null;
  sizes?: string;
  className?: string;

  isFramed?: boolean;
}

/**
 * User avatar in a 5:7 portrait frame. When no `src` is provided, it shows
 * one of the bundled default photos, picked deterministically from `pseudo`.
 */
export const ProfilePhoto = ({
  pseudo,
  displayName,
  src,
  sizes = "(max-width: 768px) 96px, 20vw",
  className,
  isFramed = false,
}: ProfilePhotoProps) => {
  const defaultIndex = (pseudo.length % DEFAULT_PROFILE_PHOTO_COUNT) + 1;
  const photo = src ?? DEFAULT_PROFILE_PHOTO(defaultIndex);

  return (
    <div
      className={cn(
        "bg-surface-50 relative aspect-[5/7] w-full overflow-hidden rounded-sm",
        isFramed && "border-primary border-4",
        className,
      )}
    >
      <Image
        src={photo}
        alt={`@${pseudo}`}
        fill
        sizes={sizes}
        className="object-cover"
      />

      <div className="from-surface-50 via-surface-50/60 absolute inset-x-0 bottom-0 h-[25%] bg-gradient-to-t from-10% via-60% to-transparent" />

      <div className="absolute right-2 bottom-1 left-2 z-10 flex flex-col text-left">
        <p className="truncate leading-none">{displayName?.firstName}</p>
        <p className="-mt-0.5 ml-2 truncate text-xl leading-none font-extrabold">
          {displayName?.lastName}
        </p>
      </div>
    </div>
  );
};
