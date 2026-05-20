"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { HobbyData, HobbyList, HobbySubForm } from "../custom";
interface HobbiesFormProps {
  defaultValue?: HobbyData[];
  onChange: (hobbies: HobbyData[]) => void;
}

export const HobbiesForm = ({ defaultValue, onChange }: HobbiesFormProps) => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  const [items, setItems] = useState<HobbyData[]>(defaultValue ?? []);
  const [editingIndex, setEditingIndex] = useState<number | "new" | null>(null);

  const openSubForm = (index: number | "new") => setEditingIndex(index);
  const closeSubForm = () => setEditingIndex(null);

  const handleSave = (data: HobbyData) => {
    let next: HobbyData[];
    if (editingIndex === "new") next = [...items, data];
    else if (typeof editingIndex === "number")
      next = items.map((h, i) => (i === editingIndex ? data : h));
    else next = items;
    setItems(next);
    onChange(next);
    closeSubForm();
  };

  const handleDelete = () => {
    if (typeof editingIndex !== "number") return;
    const next = items.filter((_, i) => i !== editingIndex);
    setItems(next);
    onChange(next);
    closeSubForm();
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {items.length === 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => openSubForm("new")}
          >
            {tCommon("addButton")}
          </Button>
        ) : (
          <HobbyList
            items={items}
            onEdit={(i) => openSubForm(i)}
            emptyLabel={t("noHobbies")}
          />
        )}
      </div>
      {editingIndex !== null && (
        <div className="bg-surface-50 fixed inset-0 z-50">
          <HobbySubForm
            initialData={
              typeof editingIndex === "number" ? items[editingIndex] : undefined
            }
            onSave={handleSave}
            onCancel={closeSubForm}
            onDelete={
              typeof editingIndex === "number" ? handleDelete : undefined
            }
          />
        </div>
      )}
    </>
  );
};
