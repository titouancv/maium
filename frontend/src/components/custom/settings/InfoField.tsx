"use client";

interface InfoFieldProps {
  label: string;
  value?: string | null;
  onEdit: () => void;
}

export const InfoField = ({ label, value, onEdit }: InfoFieldProps) => (
  <button
    type="button"
    onClick={onEdit}
    className="flex w-full items-center justify-between border-b border-brd-200 py-4"
  >
    <div className="flex flex-col items-start gap-0.5">
      <span className="text-xs text-txt-muted">{label}</span>
      <span className="text-txt">{value || "—"}</span>
    </div>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 shrink-0 text-txt-muted"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  </button>
);
