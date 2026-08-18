"use client";

import { useTranslations } from "next-intl";
import { Text, TextInput } from "@/components/ui";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export const DreamJobSalaryField = ({ value, onChange }: Props) => {
  const tDreamJob = useTranslations("dreamJob");

  return (
    <div className="flex flex-col gap-2">
      <TextInput
        type="number"
        inputMode="numeric"
        placeholder={tDreamJob("salaryPlaceholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
      />
      <Text tone="muted" size="sm">
        {tDreamJob("salarySuffix")}
      </Text>
    </div>
  );
};
