"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import type { ExperienceFormData } from "@/types/experience";
import { useTranslations } from "next-intl";
import { faviconUrl } from "@/lib/utils";

export interface ExperienceProps extends ExperienceFormData {
  onEdit: () => void;
}

export const ExperienceItem = ({
  organization,
  role,
  startPeriod,
  endPeriod,
  location,
  website,
  onEdit,
}: ExperienceProps) => {
  const t = useTranslations("common");

  const calculerDuree = (dateDebut: number, dateFin: number): string => {
    const d1 = new Date(dateDebut);
    const d2 = new Date(dateFin);
    const totalMoisDebut = d1.getUTCFullYear() * 12 + d1.getUTCMonth();
    const totalMoisFin = d2.getUTCFullYear() * 12 + d2.getUTCMonth();
    const diffMois = totalMoisFin - totalMoisDebut;
    const annees = Math.floor(diffMois / 12);
    const mois = (diffMois % 12) + 1;
    if (annees > 0) return t("yearsCount", { count: annees });
    return t("monthsCount", { count: mois });
  };

  const formatPeriod = (startDate: number, endDate?: number): string => {
    const startYear = new Date(startDate).getUTCFullYear();
    if (!endDate) return `${t("sinceLabel")} ${startYear}`;
    const endYear = new Date(endDate).getUTCFullYear();
    if (startYear === endYear) return `${startYear}`;
    return `${startYear}/${endYear}`;
  };

  const favicon = website ? faviconUrl(website) : null;
  const [now] = useState(() => Date.now());

  return (
    <div className="flex items-center gap-4">
      <div className="h-10 w-1 rounded-full bg-current"></div>
      <div className="grid w-full grid-cols-[1fr_auto] items-center gap-3">
        <div className="flex min-w-0 flex-col">
          <a
            className="flex items-center"
            href={website}
            target="_blank"
            rel="noopener noreferrer"
          >
            {favicon && (
              <Image
                src={favicon}
                alt=""
                width={16}
                height={16}
                className="mr-1 shrink-0 items-center"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <span className="truncate">{organization}</span>
            <span className="text-txt/80 truncate">{", " + role}</span>
          </a>
          <div className="flex flex-col gap-0.5">
            {location && (
              <>
                <span className="text-txt-muted min-w-0 shrink truncate text-sm">
                  {location}
                </span>
              </>
            )}
            <div className="flex flex-nowrap gap-2">
              <span className="text-txt-muted shrink-0 text-sm">
                {calculerDuree(startPeriod, endPeriod ?? now)}
              </span>
              <span className="text-txt-muted shrink-0 text-sm">•</span>
              <span
                className={`shrink-0 text-sm ${endPeriod ? "text-txt-muted" : "text-primary"}`}
              >
                {formatPeriod(startPeriod, endPeriod)}
              </span>
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={onEdit}
        >
          {t("editButton")}
        </Button>
      </div>
    </div>
  );
};
