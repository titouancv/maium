"use client";

import { useMemo } from "react";
import { useWatch, type Control, type FieldArrayWithId } from "react-hook-form";
import { ExperienceItem, type Experience } from "./ExperienceItem";

type ItemRecord = Record<string, string>;
type FormItems = { items: ItemRecord[] };

interface Props {
  fields: FieldArrayWithId<FormItems, "items">[];
  control: Control<FormItems>;
  getDisplay: (item: ItemRecord) => Omit<Experience, "editLabel" | "onEdit">;
  editLabel: string;
  onEdit: (index: number) => void;
}

const ItemRow = ({
  index,
  control,
  getDisplay,
  editLabel,
  onEdit,
}: {
  index: number;
  control: Control<FormItems>;
  getDisplay: Props["getDisplay"];
  editLabel: string;
  onEdit: () => void;
}) => {
  const items = useWatch({ control, name: "items" });
  const display = getDisplay(items?.[index] ?? {});
  return <ExperienceItem {...display} editLabel={editLabel} onEdit={onEdit} />;
};

export const ExperienceList = ({
  fields,
  control,
  getDisplay,
  editLabel,
  onEdit,
}: Props) => {
  const items = useWatch({ control, name: "items" });

  const sortedIndices = useMemo(() => {
    const allItems = items ?? [];
    const withDisplay = allItems.slice(0, fields.length).map((item, index) => ({
      index,
      display: getDisplay((item as ItemRecord) ?? {}),
    }));

    const ongoing = withDisplay.filter((x) => !x.display.endPeriod);
    const finished = withDisplay.filter((x) => !!x.display.endPeriod);

    ongoing.sort((a, b) =>
      b.display.startPeriod.localeCompare(a.display.startPeriod),
    );
    finished.sort((a, b) =>
      b.display.startPeriod.localeCompare(a.display.startPeriod),
    );

    return [...ongoing, ...finished].map((x) => x.index);
  }, [items, fields.length, getDisplay]);

  return (
    <div className="flex flex-col gap-3">
      {sortedIndices.map((originalIndex) => (
        <ItemRow
          key={fields[originalIndex]?.id}
          index={originalIndex}
          control={control}
          getDisplay={getDisplay}
          editLabel={editLabel}
          onEdit={() => onEdit(originalIndex)}
        />
      ))}
    </div>
  );
};
