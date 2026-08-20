"use client";

import { HobbyItem, type HobbyItemData } from "../items/HobbyItem";

interface Props {
  hobbies: HobbyItemData[];
  onEdit?: (index: number) => void;
  onMove?: (from: number, to: number) => void;
}

export const HobbyList = ({ hobbies, onEdit, onMove }: Props) => {
  return (
    <div className="@container w-full">
      <ul className="grid max-w-3xl grid-cols-2 gap-4 @2xl:grid-cols-4">
        {hobbies.map((hobby, i) => (
          <li key={i}>
            <HobbyItem
              hobby={hobby}
              onClick={onEdit ? () => onEdit(i) : undefined}
              onMovePrevious={
                onMove && i > 0 ? () => onMove(i, i - 1) : undefined
              }
              onMoveNext={
                onMove && i < hobbies.length - 1
                  ? () => onMove(i, i + 1)
                  : undefined
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
};
