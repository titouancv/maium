"use client";

import { useState } from "react";
import { TextArea } from "@/components/ui/TextArea";

interface LongTextFormProps {
  defaultValue?: string;
  placeholder: string;
  onChange: (value: string) => void;
  infoLabel?: string;
  infoType?: "error" | "success" | "info";
  rows?: number;
}

export const LongTextForm = ({
  defaultValue = "",
  placeholder,
  onChange,
  infoLabel,
  infoType = "info",
  rows = 5,
}: LongTextFormProps) => {
  const [value, setValue] = useState(defaultValue);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    <TextArea
      placeholder={placeholder}
      autoFocus
      value={value}
      onChange={handleChange}
      infoLabel={infoLabel}
      infoType={infoType}
      row={rows}
    />
  );
};
