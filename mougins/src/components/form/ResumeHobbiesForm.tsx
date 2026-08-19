"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Overlay } from "@/components/ui/Overlay";
import { HobbyList } from "@/components/ui";
import { ResumeHobbySubForm } from "./sub-form/ResumeHobbySubForm";
import type { ResumeHobby } from "@/types/job";
import { useListEditor } from "@/hooks";

interface ResumeHobbiesFormProps {
  defaultValue?: ResumeHobby[];
  onChange: (hobbies: ResumeHobby[]) => void;
}

export const ResumeHobbiesForm = ({
  defaultValue,
  onChange,
}: ResumeHobbiesFormProps) => {
  const tCommon = useTranslations("common");

  const [items, setItems] = useState<ResumeHobby[]>(defaultValue ?? []);
  const editor = useListEditor();

  const handleSave = (data: ResumeHobby) => {
    let next: ResumeHobby[];
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
        <Overlay onClose={editor.close}>
          <ResumeHobbySubForm
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
