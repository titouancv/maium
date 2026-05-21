"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TextInput } from "@/components/ui/TextInput";
import { ChipList } from "@/components/ui/ChipList";
import { Button } from "@/components/ui/Button";

interface KeysFormProps {
  defaultValue?: string[];
  placeholder: string;
  onChange: (keys: string[]) => void;
}

export const KeysForm = ({
  defaultValue,
  placeholder,
  onChange,
}: KeysFormProps) => {
  const tCommon = useTranslations("common");

  const [items, setItems] = useState<string[]>(defaultValue ?? []);
  const [draft, setDraft] = useState("");

  const handleAdd = () => {
    const val = draft.trim();
    if (!val) return;
    const next = [...items, val];
    setItems(next);
    onChange(next);
    setDraft("");
  };

  const handleRemove = (i: number) => {
    const next = items.filter((_, idx) => idx !== i);
    setItems(next);
    onChange(next);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8">
      <div className="flex shrink-0 flex-col gap-2">
        <TextInput
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button
          variant="outline"
          type="button"
          className="w-full"
          onClick={handleAdd}
        >
          {tCommon("addButton")}
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <ChipList items={items} onRemove={handleRemove} />
      </div>
    </div>
  );
};
