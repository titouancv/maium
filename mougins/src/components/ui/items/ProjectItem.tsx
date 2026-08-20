"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Icon, Text, Title, UrlItem } from "@/components/ui";
import { UI_VARIANTS } from "@/constants";
import { imageBackdropTheme, useImageTone } from "@/hooks";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/user";

interface Props {
  project: Project;
  onClick?: () => void;
}

export const ProjectItem = ({ project, onClick }: Props) => {
  const t = useTranslations("common");
  const [isLandscape, setIsLandscape] = useState(false);
  const tone = useImageTone(project.imageUrl);
  const isCutout = tone !== null;

  const measureIfLoaded = (image: HTMLImageElement | null) => {
    if (image?.complete && image.naturalWidth) {
      setIsLandscape(image.naturalWidth > image.naturalHeight);
    }
  };

  return (
    <article className="flex flex-col gap-3">
      {/* Cutout images (transparent logos) get the opposite theme behind them so
          a dark logo never lands on a dark surface, and vice versa. */}
      <div
        data-theme={imageBackdropTheme(tone)}
        className="bg-surface-50 text-txt @container relative aspect-video w-full overflow-hidden rounded-sm"
      >
        {project.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.imageUrl}
              alt=""
              aria-hidden
              className={cn(
                "absolute inset-0 h-full w-full scale-125 object-cover blur-xl",
                isCutout ? "opacity-25" : "opacity-40",
              )}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.imageUrl}
              alt=""
              ref={measureIfLoaded}
              onLoad={(e) => measureIfLoaded(e.currentTarget)}
              className={cn(
                "absolute inset-0 z-1 h-full w-full",
                isCutout
                  ? "object-contain p-[8cqw] pb-[16cqw]"
                  : isLandscape
                    ? "object-cover"
                    : "object-contain",
              )}
            />
          </>
        ) : (
          <span
            aria-hidden
            className="text-txt-muted/25 absolute inset-0 flex items-center justify-center text-[26cqw] leading-none font-extrabold"
          >
            {project.title.charAt(0).toUpperCase()}
          </span>
        )}

        <div className="from-surface-50 via-surface-50/60 absolute inset-x-0 bottom-0 z-2 h-[55%] bg-gradient-to-t from-10% via-60% to-transparent" />

        <div className="absolute inset-x-[4cqw] bottom-[3cqw] z-3">
          <Title label={project.title} size="h5" />
        </div>
      </div>

      {project.bio && (
        <Text tone="muted" size="sm">
          {project.bio}
        </Text>
      )}

      {(project.websiteUrl || project.githubUrl || onClick) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {project.websiteUrl && (
            <a
              href={project.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "focus-visible:outline-inverse-50 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-1 text-sm focus-visible:outline focus-visible:outline-2 active:scale-95",
                UI_VARIANTS.primary,
              )}
            >
              {t("visitWebsiteButton")}
              <Icon name="externalLink" size={12} />
            </a>
          )}
          {project.githubUrl && <UrlItem url={project.githubUrl} />}
          {onClick && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-auto shrink-0"
              onClick={onClick}
            >
              {t("editButton")}
            </Button>
          )}
        </div>
      )}
    </article>
  );
};
