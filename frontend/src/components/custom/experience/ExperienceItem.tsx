"use client";

import { Button } from "@/components/ui/Button";

interface Props {
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
}: Props) => {
  const endDisplay = endPeriod
    ? ` — ${endPeriod}`
    : presentLabel
      ? ` — ${presentLabel}`
      : "";

  return (
    <div className="border-brd-200 flex items-center justify-between gap-3 rounded-2xl border p-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-medium">{title}</span>
        <span className="text-txt-muted truncate text-sm">{subtitle}</span>
        <span className="text-txt-muted text-sm">
          {startPeriod}
          {endDisplay}
        </span>
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
  );
};
