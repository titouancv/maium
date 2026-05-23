"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { HobbyData, HobbyList, HobbySubForm } from "../custom";
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
            <HobbyList hobbies={items} onEdit={editor.openExisting} />
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
        <div className="bg-surface-50 fixed inset-0 z-50">
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
        </div>
      )}
    </>
  );
};
