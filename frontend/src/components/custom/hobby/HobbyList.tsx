"use client";

import type { HobbyData } from "../../form/sub-form/HobbySubForm";
import { HobbyItem } from "./HobbyItem";

interface Props {
  hobbies: HobbyData[];
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
