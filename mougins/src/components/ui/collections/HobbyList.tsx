"use client";

import { HobbyItem, type HobbyItemData } from "../items/HobbyItem";

interface Props {
  hobbies: HobbyItemData[];
  onEdit?: (index: number) => void;
}

export const HobbyList = ({ hobbies, onEdit }: Props) => {
  return (
    <ul className="flex flex-col gap-2">
      {hobbies.map((hobby, i) => (
        <li key={i}>
          <HobbyItem
            hobby={hobby}
            onClick={onEdit ? () => onEdit(i) : undefined}
          />
        </li>
      ))}
    </ul>
  );
};
