"use client";

import type { HobbyData } from "./HobbySubForm";

interface Props {
  items: HobbyData[];
  onEdit: (index: number) => void;
  emptyLabel: string;
}

export const HobbyList = ({ items, onEdit, emptyLabel }: Props) => {
  if (items.length === 0) return <p className="text-txt-muted text-sm">{emptyLabel}</p>;

  return (
    <ul className="flex flex-col gap-2">
      {items.map((hobby, i) => (
        <li key={i}>
          <button
            type="button"
            onClick={() => onEdit(i)}
            className="border-brd-200 flex w-full items-center justify-between rounded-xl border p-3 text-left"
          >
            <div className="min-w-0">
              <p className="text-txt font-medium">{hobby.title}</p>
              {hobby.description && (
                <p className="text-txt-muted truncate text-sm">{hobby.description}</p>
              )}
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="text-txt-muted ml-2 h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
};
