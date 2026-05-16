"use client";

import Image from "next/image";
import { Button } from "@/components/ui/Button";

export interface Experience {
  title: string;
  subtitle: string;
  startPeriod: string;
  endPeriod?: string;
  description?: string;
  website?: string;
  location?: string;
  presentLabel?: string;
  editLabel: string;
  onEdit: () => void;
}

export const ExperienceItem = ({
  title,
  subtitle,
  startPeriod,
  endPeriod,
  location,
  website,
  description,
  presentLabel,
  editLabel,
  onEdit,
}: Experience) => {
  const calculerDuree = (dateDebut: string, dateFin: string): string => {
    const [anneeDebut, moisDebut] = dateDebut.split("-").map(Number);
    const [anneeFin, moisFin] = dateFin.split("-").map(Number);

    const totalMoisDebut = anneeDebut * 12 + (moisDebut - 1);
    const totalMoisFin = anneeFin * 12 + (moisFin - 1);

    const diffMois = totalMoisFin - totalMoisDebut;

    const annees = Math.floor(diffMois / 12);
    const mois = (diffMois % 12) + 1;

    if (annees > 0) {
      return `${annees} an${annees > 1 ? "s" : ""}`;
    } else {
      return `${mois} mois`;
    }
  };
  const formatPeriod = (startDate: string, endDate?: string): string => {
    const [startYear] = startDate.split("-").map(Number);
    if (!endDate) {
      return `${startYear}`;
    }
    const [endYear] = endDate.split("-").map(Number);
    if (startYear === endYear) {
      return `${startYear}`;
    }
    return `${startYear}/${endYear}`;
  };
  const faviconUrl = website
    ? `https://www.google.com/s2/favicons?domain=${new URL(website).hostname}&sz=32`
    : null;

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
            {faviconUrl && (
              <Image
                src={faviconUrl}
                alt=""
                width={16}
                height={16}
                className="mr-1 shrink-0 items-center"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <span className="truncate">{title}</span>
            <span className="text-txt/80 truncate">{", " + subtitle}</span>
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
                {calculerDuree(
                  startPeriod,
                  endPeriod || new Date().toISOString().slice(0, 7),
                )}
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
          {editLabel}
        </Button>
      </div>
    </div>
  );
};
