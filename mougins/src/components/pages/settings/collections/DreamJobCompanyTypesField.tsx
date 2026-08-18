"use client";

import { useTranslations } from "next-intl";
import { Chip } from "@/components/ui";
import { DREAM_COMPANY_TYPES } from "@/constants";

interface Props {
  value: string[];
  onChange: (value: string[]) => void;
}

export const DreamJobCompanyTypesField = ({ value, onChange }: Props) => {
  const tCompanyType = useTranslations("dreamCompanyType");

  const toggle = (type: string) => {
    onChange(
      value.includes(type)
        ? value.filter((t) => t !== type)
        : [...value, type],
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {DREAM_COMPANY_TYPES.map((type) => (
        <Chip
          key={type}
          label={tCompanyType(type)}
          selected={value.includes(type)}
          onClick={() => toggle(type)}
        />
      ))}
    </div>
  );
};
