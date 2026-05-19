"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TextInput } from "@/components/ui/TextInput";
import { ChipList } from "@/components/ui/ChipList";
import { Button } from "@/components/ui/Button";

interface KeysFormProps {
  defaultKeys?: string[];
  placeholder: string;
  emptyLabel: string;
  onChange: (keys: string[]) => void;
}

export const KeysForm = ({ defaultKeys, placeholder, emptyLabel, onChange }: KeysFormProps) => {
  const tCommon = useTranslations("common");

  const [items, setItems] = useState<string[]>(defaultKeys ?? []);
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
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2">
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
          infoLabel=""
          infoType="info"
        />
        <Button variant="outline" type="button" className="mt-1 shrink-0" onClick={handleAdd}>
          {tCommon("addButton")}
        </Button>
      </div>
      <ChipList items={items} onRemove={handleRemove} emptyLabel={emptyLabel} />
    </div>
  );
};
