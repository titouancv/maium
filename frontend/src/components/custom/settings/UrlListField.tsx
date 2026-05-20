"use client";

import { TextInput } from "@/components/ui";
import { SocialNetworkItem } from "./SocialNetworkItem";
import { UrlItem } from "./UrlItem";

interface Props {
  items: string[];
  draft: string;
  draftError: string | null;
  onDraftChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  isSocialNetwork?: boolean;
}

const RemoveButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-txt-muted hover:text-error shrink-0 transition-colors"
    aria-label="Remove"
  >
    <svg
      width="14"
      height="14"
      viewBox="0 0 8 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <line x1="1" y1="1" x2="7" y2="7" />
      <line x1="7" y1="1" x2="1" y2="7" />
    </svg>
  </button>
);

export const UrlListField = ({
  items,
  draft,
  draftError,
  onDraftChange,
  onAdd,
  onRemove,
  isSocialNetwork,
}: Props) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-start gap-2">
      <TextInput
        placeholder="https://..."
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd();
          }
        }}
        infoLabel={draftError ?? ""}
        infoType={draftError ? "error" : "info"}
      />
    </div>
    {items.length > 0 && (
      <ul className="flex flex-col gap-2">
        {items.map((url, i) => {
          return (
            <li
              key={`${url}-${i}`}
              className="flex items-center justify-between gap-3"
            >
              {isSocialNetwork ? (
                <SocialNetworkItem url={url} />
              ) : (
                <UrlItem url={url} />
              )}
              <RemoveButton onClick={() => onRemove(i)} />
            </li>
          );
        })}
      </ul>
    )}
  </div>
);
