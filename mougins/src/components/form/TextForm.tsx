"use client";

import { useState } from "react";
import { TextInput } from "@/components/ui/TextInput";
import type { InfoType } from "@/constants";

interface TextFormProps {
  defaultValue?: string;
  placeholder: string;
  onChange: (value: string) => void;
  onPrimary?: () => void;
  infoLabel?: string;
  infoType?: InfoType;
}

export const TextForm = ({
  defaultValue = "",
  placeholder,
  onChange,
  onPrimary,
  infoLabel,
  infoType = "info",
}: TextFormProps) => {
  const [value, setValue] = useState(defaultValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    <div className="md:flex md:flex-1 md:flex-col md:justify-center">
      <TextInput
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onPrimary?.();
          }
        }}
        enterKeyHint="done"
        infoLabel={infoLabel}
        infoType={infoType}
      />
    </div>
  );
};
