"use client";

import { useTranslations } from "next-intl";
import { Icon } from "./icons";

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
      <Icon name="search" strokeWidth={2.5} />
    </button>
  );
}
