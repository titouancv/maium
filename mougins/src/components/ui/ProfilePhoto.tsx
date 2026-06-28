import Image from "next/image";
import {
  DEFAULT_FRAME,
  DEFAULT_PROFILE_PHOTO,
  DEFAULT_PROFILE_PHOTO_COUNT,
  type Gender,
} from "@/constants";
import { cn } from "@/lib/utils";

interface ProfilePhotoProps {
  pseudo: string;
  displayName?: { firstName: string; lastName: string };
  src?: string | null;
  sizes?: string;
  className?: string;
  /** Biases the default-photo pick: `male` → even photos, `female` → odd. */
  gender: Gender | null;
  /**
   * Hide the name overlay from the `md` breakpoint up (CSS-only, so SSR and the
   * client render the same HTML — used by the profile avatar, where the @pseudo
   * shows below on desktop). Mobile-first: the overlay still shows on small
   * screens.
   */
  hideNameOnDesktop?: boolean;

  isFramed?: boolean;
  isFrameMuted?: boolean;
}

/**
 * Pick a default profile photo deterministically from `pseudo`. When a binary
 * `gender` is given, the pick is constrained to one half of the bundled photos:
 * even-numbered for `male`, odd-numbered for `female`. Any other value (incl.
 * `other`/unset) picks freely across all photos.
 */
const defaultPhotoIndex = (pseudo: string, gender: Gender | null) => {
  if (gender === "male" || gender === "female") {
    const half = DEFAULT_PROFILE_PHOTO_COUNT / 2;
    const offset = gender === "male" ? 2 : 1; // even vs. odd 1-based index
    return (pseudo.length % half) * 2 + offset;
  }
  return (pseudo.length % DEFAULT_PROFILE_PHOTO_COUNT) + 1;
};

/**
 * User avatar in a 5:7 portrait frame. When no `src` is provided, it shows
 * one of the bundled default photos, picked deterministically from `pseudo`
 * (and biased by `gender` when provided).
 */
export const ProfilePhoto = ({
  pseudo,
  displayName,
  src,
  sizes = "(max-width: 768px) 96px, 20vw",
  className,
  gender,
  hideNameOnDesktop = false,
  isFramed = false,
  isFrameMuted = false,
}: ProfilePhotoProps) => {
  const photo = src ?? DEFAULT_PROFILE_PHOTO(defaultPhotoIndex(pseudo, gender));

  return (
    <div
      className={cn(
        "bg-surface-50 @container relative aspect-[5/7] w-full overflow-hidden rounded-sm",
        className,
      )}
    >
      <Image
        src={photo}
        alt={`@${pseudo}`}
        fill
        sizes={sizes}
        className={cn("object-cover", isFramed && "p-4")}
      />

      {isFramed && (
        <Image
          src={DEFAULT_FRAME}
          alt=""
          aria-hidden
          fill
          className={cn(
            "pointer-events-none z-1 object-cover",
            isFrameMuted && "grayscale",
          )}
        />
      )}

      <div className="from-surface-50 via-surface-50/60 absolute inset-x-0 bottom-0 z-2 h-[25%] bg-gradient-to-t from-10% via-60% to-transparent" />

      <div
        className={cn(
          "absolute right-[3cqw] bottom-[1.5cqw] left-[3cqw] z-3 flex flex-col text-left",
          hideNameOnDesktop && "md:hidden",
        )}
      >
        <p className="truncate text-[9cqw] leading-none">
          {displayName?.firstName}
        </p>
        <p className="-mt-[0.5cqw] ml-[3cqw] truncate text-[13cqw] leading-none font-extrabold">
          {displayName?.lastName}
        </p>
      </div>
    </div>
  );
};
