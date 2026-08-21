"use client";

import { useState } from "react";
import { Text, Title } from "@/components/ui";
import { imageBackdropTheme, useImageTone } from "@/hooks";
import { cn } from "@/lib/utils";

export interface HobbyItemData {
  title: string;
  description: string;
  imageUrl?: string;
}

interface Props {
  hobby: HobbyItemData;
}

export const HobbyItem = ({ hobby }: Props) => {
  const [isPortrait, setIsPortrait] = useState(false);
  const tone = useImageTone(hobby.imageUrl);
  const isCutout = tone !== null;

  const measureIfLoaded = (image: HTMLImageElement | null) => {
    if (image?.complete && image.naturalWidth) {
      setIsPortrait(image.naturalHeight > image.naturalWidth);
    }
  };

  return (
    <article className="flex flex-col gap-3">
      {/* Cutout images (transparent logos) get the opposite theme behind them so
          a dark logo never lands on a dark surface, and vice versa. */}
      <div
        data-theme={imageBackdropTheme(tone)}
        className="bg-surface-50 text-txt @container relative aspect-[5/7] w-full overflow-hidden rounded-sm"
      >
        {hobby.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hobby.imageUrl}
              alt=""
              aria-hidden
              className={cn(
                "absolute inset-0 h-full w-full scale-125 object-cover blur-xl",
                isCutout ? "opacity-25" : "opacity-40",
              )}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hobby.imageUrl}
              alt=""
              ref={measureIfLoaded}
              onLoad={(e) => measureIfLoaded(e.currentTarget)}
              className={cn(
                "absolute inset-0 z-1 h-full w-full",
                isCutout
                  ? "object-contain p-[12cqw] pb-[26cqw]"
                  : isPortrait
                    ? "object-cover"
                    : "object-contain",
              )}
            />
          </>
        ) : (
          <span
            aria-hidden
            className="text-txt-muted/25 absolute inset-0 flex items-center justify-center text-[45cqw] leading-none font-extrabold"
          >
            {hobby.title.charAt(0).toUpperCase()}
          </span>
        )}

        <div className="from-surface-50 via-surface-50/60 absolute inset-x-0 bottom-0 z-2 h-[45%] bg-gradient-to-t from-10% via-60% to-transparent" />

        <div className="absolute inset-x-[6cqw] bottom-[5cqw] z-3">
          <Title label={hobby.title} size="h5" />
        </div>
      </div>

      {hobby.description && (
        <Text tone="muted" size="sm">
          {hobby.description}
        </Text>
      )}
    </article>
  );
};
