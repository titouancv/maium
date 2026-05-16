"use client";

import { Button } from "@/components/ui/Button";

export interface Experience {
  title: string;
  subtitle: string;
  startPeriod: string;
  endPeriod?: string;
  presentLabel?: string;
  editLabel: string;
  onEdit: () => void;
}

export const ExperienceItem = ({
  title,
  subtitle,
  startPeriod,
  endPeriod,
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
  return (
    <div className="flex items-center gap-4">
      <div className="h-10 w-1 rounded-full bg-current"></div>
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <div className="flex">
            <span className="truncate">{title}</span>
            <span className="text-txt/80 truncate">{", " + subtitle}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-txt-muted text-sm">
              {calculerDuree(
                startPeriod,
                endPeriod || new Date().toISOString().slice(0, 7),
              )}
            </span>
            <span className="text-txt-muted text-sm">•</span>
            <span className="text-txt-muted text-sm">
              {formatPeriod(startPeriod, endPeriod)}
            </span>
            {!endPeriod && (
              <>
                <span className="text-txt-muted text-sm">•</span>
                <span className="text-primary text-sm">{presentLabel}</span>
              </>
            )}
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
