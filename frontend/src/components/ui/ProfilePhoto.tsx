import Image from "next/image";
import {
  DEFAULT_PROFILE_PHOTO,
  DEFAULT_PROFILE_PHOTO_COUNT,
} from "@/constants";
import { cn } from "@/lib/utils";

interface ProfilePhotoProps {
  /** Used to pick a stable default photo and as the image alt text. */
  pseudo: string;
  /** Uploaded photo URL; falls back to a default when absent. */
  src?: string | null;
  /** `sizes` hint forwarded to `next/image` for responsive loading. */
  sizes?: string;
  /** Override container sizing/shape (merged after the defaults). */
  className?: string;
  /** Hide the bottom fade gradient (e.g. unseen story bubbles). */
  hideGradient?: boolean;

  isFramed?: boolean;
}

/**
 * User avatar in a 5:7 portrait frame. When no `src` is provided, it shows
 * one of the bundled default photos, picked deterministically from `pseudo`.
 */
export const ProfilePhoto = ({
  pseudo,
  src,
  sizes = "(max-width: 768px) 96px, 20vw",
  className,
  hideGradient = false,
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
      {!hideGradient && !isFramed && (
        <div className="from-surface-50 absolute inset-x-0 bottom-0 h-[25%] bg-gradient-to-t to-transparent" />
      )}
    </div>
  );
};
