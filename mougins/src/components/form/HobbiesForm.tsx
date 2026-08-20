"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Overlay } from "@/components/ui/Overlay";
import { HobbyList } from "@/components/ui";
import { HobbySubForm } from "./sub-form/HobbySubForm";
import type { HobbyData } from "@/types/user";
import { useListEditor } from "@/hooks";

interface HobbiesFormProps {
  defaultValue?: HobbyData[];
  onChange: (hobbies: HobbyData[]) => void;
}

export const HobbiesForm = ({ defaultValue, onChange }: HobbiesFormProps) => {
  const tCommon = useTranslations("common");

  const [items, setItems] = useState<HobbyData[]>(defaultValue ?? []);
  const editor = useListEditor();

  const handleSave = (data: HobbyData) => {
    let next: HobbyData[];
    if (editor.editingIndex === "new") next = [...items, data];
    else if (typeof editor.editingIndex === "number")
      next = items.map((h, i) => (i === editor.editingIndex ? data : h));
    else next = items;
    setItems(next);
    onChange(next);
    editor.close();
  };

  const handleMove = (from: number, to: number) => {
    const next = [...items];
    [next[from], next[to]] = [next[to], next[from]];
    setItems(next);
    onChange(next);
  };

  const handleDelete = () => {
    if (typeof editor.editingIndex !== "number") return;
    const next = items.filter((_, i) => i !== editor.editingIndex);
    setItems(next);
    onChange(next);
    editor.close();
  };

  return (
    <>
      {items.length === 0 ? (
        <div className="flex h-full w-full flex-col justify-center">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full self-start"
            onClick={editor.openNew}
          >
            {tCommon("addButton")}
          </Button>
        </div>
      ) : (
        <div className="flex h-full w-full flex-col justify-between gap-4">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <HobbyList
              hobbies={items}
              onEdit={editor.openExisting}
              onMove={handleMove}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full self-start"
            onClick={editor.openNew}
          >
            {tCommon("addButton")}
          </Button>
        </div>
      )}
      {editor.isEditing && (
        <Overlay onClose={editor.close}>
          <HobbySubForm
            initialData={
              typeof editor.editingIndex === "number"
                ? items[editor.editingIndex]
                : undefined
            }
            onSave={handleSave}
            onCancel={editor.close}
            onDelete={editor.isEditingExisting ? handleDelete : undefined}
          />
        </Overlay>
      )}
    </>
  );
};
