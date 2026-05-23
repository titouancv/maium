"use client";

import { useMemo } from "react";
import { ExperienceItem } from "./ExperienceItem";
import type { Experience } from "@/types/experience";

interface Props {
  experiences: Experience[];
  onEdit?: (index: number) => void;
  className?: string;
}

export const ExperienceList = ({ experiences, onEdit, className }: Props) => {
  const sortedItems = useMemo(() => {
    const indexed = experiences.map((exp, index) => ({ exp, index }));
    const ongoing = indexed.filter((x) => !x.exp.endPeriod);
    const finished = indexed.filter((x) => !!x.exp.endPeriod);
    ongoing.sort((a, b) => b.exp.startPeriod - a.exp.startPeriod);
    finished.sort((a, b) => b.exp.startPeriod - a.exp.startPeriod);
    return [...ongoing, ...finished];
  }, [experiences]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {sortedItems.map(({ exp, index }) => (
        <ExperienceItem
          key={index}
          {...exp}
          onEdit={onEdit ? () => onEdit(index) : undefined}
        />
      ))}
    </div>
  );
};
