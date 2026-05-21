"use client";

import type { HobbyData } from "../../form/sub-form/HobbySubForm";
import { HobbyItem } from "./HobbyItem";

interface Props {
  items: HobbyData[];
  onEdit: (index: number) => void;
  emptyLabel: string;
}

export const HobbyList = ({ items, onEdit, emptyLabel }: Props) => {
  if (items.length === 0)
    return <p className="text-txt-muted text-sm">{emptyLabel}</p>;

  return (
    <ul className="flex flex-col gap-2">
      {items.map((hobby, i) => (
        <li key={i}>
          <HobbyItem hobby={hobby} onClick={() => onEdit(i)} />
        </li>
      ))}
    </ul>
  );
};
