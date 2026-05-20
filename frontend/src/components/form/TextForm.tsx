"use client";

import { useState } from "react";
import { TextInput } from "@/components/ui/TextInput";

interface TextFormProps {
  defaultValue?: string;
  placeholder: string;
  onChange: (value: string) => void;
  infoLabel?: string;
  infoType?: "error" | "success" | "info";
}

export const TextForm = ({
  defaultValue = "",
  placeholder,
  onChange,
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
        infoLabel={infoLabel}
        infoType={infoType}
      />
    </div>
  );
};
