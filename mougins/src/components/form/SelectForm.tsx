"use client";

import { useState } from "react";
import { TabsVertical } from "@/components/ui/TabsVertical";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface SelectFormProps<T extends string> {
  options: SelectOption<T>[];
  defaultValue?: T;
  onChange: (value: T) => void;
  footer?: React.ReactNode;
}

export function SelectForm<T extends string>({
  options,
  defaultValue,
  onChange,
  footer,
}: SelectFormProps<T>) {
  const [index, setIndex] = useState(() => {
    const i = options.findIndex((o) => o.value === defaultValue);
    return i === -1 ? 0 : i;
  });

  const handleChange = (i: number) => {
    setIndex(i);
    onChange(options[i].value);
  };

  const active = options[index];

  return (
    <div className="flex h-full flex-col justify-between gap-6">
      <div className="flex flex-col gap-6">
        <TabsVertical
          tabs={options.map((o) => o.label)}
          activeTab={index}
          onChange={handleChange}
        />
        {active?.description && (
          <p className="text-txt-muted text-sm">{active.description}</p>
        )}
      </div>
      {footer}
    </div>
  );
}
