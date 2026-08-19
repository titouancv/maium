"use client";

import { useState } from "react";
import Image from "next/image";
import { CoverFlow } from "@/components/ui";
import { PROFILE_GALLERY_PHOTO_ASPECT } from "@/constants";
import type { UserPhoto } from "@/types/user";

interface Props {
  photos: UserPhoto[];
}

export const ProfilePhotoGallery = ({ photos }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="h-64 w-full md:h-80">
      <CoverFlow
        items={photos}
        activeIndex={activeIndex}
        onChange={setActiveIndex}
        getKey={(photo) => photo.id}
        renderItem={(photo, isActive) => (
          <div
            className="bg-surface-100 relative h-64 w-48 overflow-hidden rounded-sm md:h-80 md:w-60"
            style={{ aspectRatio: PROFILE_GALLERY_PHOTO_ASPECT }}
          >
            <Image
              src={photo.url}
              alt=""
              fill
              sizes="240px"
              className="object-cover"
              priority={isActive}
            />
          </div>
        )}
      />
    </div>
  );
};
