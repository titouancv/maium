"use client";

import { HobbyItem, type HobbyItemData } from "../items/HobbyItem";

interface Props {
  hobbies: HobbyItemData[];
}

export const HobbyList = ({ hobbies }: Props) => {
  return (
    <div className="@container w-full">
      <ul className="grid max-w-3xl grid-cols-2 gap-4 @2xl:grid-cols-4">
        {hobbies.map((hobby, i) => (
          <li key={i}>
            <HobbyItem hobby={hobby} />
          </li>
        ))}
      </ul>
    </div>
  );
};
