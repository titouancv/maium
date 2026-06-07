"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import type { Experience } from "@/types/experience";
import { useTranslations } from "next-intl";
import { faviconUrl } from "@/lib/utils";
import { experienceDurationParts, experiencePeriodYears } from "@/lib/date";

export interface ExperienceProps extends Experience {
  onEdit?: () => void;
}

export const ExperienceItem = ({
  organization,
  role,
  startPeriod,
  endPeriod,
  location,
  website,
  onEdit,
  description,
}: ExperienceProps) => {
  const t = useTranslations("common");

  const calculateDuration = (startDate: number, endDate: number): string => {
    const { years, months } = experienceDurationParts(startDate, endDate);
    if (years > 0) return t("yearsCount", { count: years });
    return t("monthsCount", { count: months });
  };

  const formatPeriod = (startDate: number, endDate?: number): string => {
    const { startYear, endYear } = experiencePeriodYears(startDate, endDate);
    if (endYear === undefined) return `${t("sinceLabel")} ${startYear}`;
    if (startYear === endYear) return `${startYear}`;
    return `${startYear}/${endYear}`;
  };

  const favicon = website ? faviconUrl(website) : null;
  const [now] = useState(() => Date.now());
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = descRef.current;
    if (el) setIsClamped(el.scrollHeight > el.clientHeight);
  }, [description]);

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="my-1 w-1 self-stretch rounded-full bg-current"></div>
        <div className="grid w-full grid-cols-[1fr_auto] items-center gap-3">
          <a
            className={`group flex min-w-0 flex-col ${website ? "cursor-pointer" : "cursor-default"}`}
            href={website}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div
              className={`flex items-center text-lg ${website ? "group-hover:text-primary" : ""}`}
            >
              {favicon && (
                <Image
                  src={favicon}
                  alt=""
                  width={16}
                  height={16}
                  className="mr-1 shrink-0 items-center"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              )}
              <span className="truncate">{organization}</span>
              <span
                className={`text-txt/80 truncate ${website ? "group-hover:text-primary" : ""}`}
              >
                {", " + role}
              </span>
            </div>
            <div className="flex flex-col text-sm">
              {location && (
                <>
                  <span className="text-txt-muted min-w-0 shrink truncate">
                    {location}
                  </span>
                </>
              )}
              <div className="flex flex-nowrap gap-2">
                <span className="text-txt-muted shrink-0">
                  {calculateDuration(startPeriod, endPeriod ?? now)}
                </span>
                <span className="text-txt-muted shrink-0">•</span>
                <span
                  className={`shrink-0 ${endPeriod ? "text-txt-muted" : "text-primary"}`}
                >
                  {formatPeriod(startPeriod, endPeriod)}
                </span>
              </div>
            </div>
          </a>
          {onEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={onEdit}
            >
              {t("editButton")}
            </Button>
          )}
        </div>
      </div>
      {onEdit === undefined && description && (
        <div className="pl-5">
          <p
            ref={descRef}
            className={`text-txt text-sm ${!expanded ? "line-clamp-5" : ""}`}
          >
            {description}
          </p>
          {(isClamped || expanded) && (
            <Button
              type="button"
              variant="ghost"
              size="none"
              className="mt-1 h-auto py-0.5 text-sm"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? t("seeLessButton") : t("seeMoreButton")}
            </Button>
          )}
        </div>
      )}
    </>
  );
};
