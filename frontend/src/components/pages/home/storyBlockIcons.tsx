import type { StoryBlockType } from "@/types/story";

/* -------------------------------------------------------------------------- */
/* Shared icons for the story block editor (row, type sheet, footer)          */
/* -------------------------------------------------------------------------- */

const ICON_PROPS = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function BlockIcon({ type }: { type: StoryBlockType }) {
  switch (type) {
    case "heading":
      return (
        <svg {...ICON_PROPS}>
          <path d="M6 4v16M18 4v16M6 12h12" />
        </svg>
      );
    case "highlight":
      return (
        <svg {...ICON_PROPS}>
          <path d="M5 5v14" />
          <path d="M10 7h9M10 12h9M10 17h5" />
        </svg>
      );
    case "bullet":
      return (
        <svg {...ICON_PROPS}>
          <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
        </svg>
      );
    case "text":
    default:
      return (
        <svg {...ICON_PROPS}>
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      );
  }
}

export function PlusIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function EyeIcon() {
  return (
    <svg {...ICON_PROPS} width={16} height={16}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EditIcon() {
  return (
    <svg {...ICON_PROPS} width={16} height={16}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
