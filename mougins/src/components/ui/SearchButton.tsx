"use client";

import { useTranslations } from "next-intl";

interface SearchButtonProps {
  onClick: () => void;
}

export function SearchButton({ onClick }: SearchButtonProps) {
  const t = useTranslations("nav");

  return (
    <button
      onClick={onClick}
      aria-label={t("searchLabel")}
      className="bg-inverse-50 text-txt-inverse hover:text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-opacity hover:cursor-pointer active:scale-95"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </button>
  );
}
