"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Overlay } from "@/components/ui/Overlay";
import { CompactItem, ReorderableList } from "@/components/ui";
import { ProjectSubForm } from "./sub-form/ProjectSubForm";
import type { Project } from "@/types/user";
import { useListEditor } from "@/hooks";

interface ProjectsFormProps {
  defaultValue?: Project[];
  onChange: (projects: Project[]) => void;
}

export const ProjectsForm = ({ defaultValue, onChange }: ProjectsFormProps) => {
  const tCommon = useTranslations("common");

  const [items, setItems] = useState<Project[]>(defaultValue ?? []);
  const editor = useListEditor();

  const handleSave = (data: Project) => {
    let next: Project[];
    if (editor.editingIndex === "new") next = [...items, data];
    else if (typeof editor.editingIndex === "number")
      next = items.map((p, i) => (i === editor.editingIndex ? data : p));
    else next = items;
    setItems(next);
    onChange(next);
    editor.close();
  };

  const handleReorder = (next: Project[]) => {
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
            <ReorderableList items={items} onReorder={handleReorder}>
              {(project, i, handleProps) => (
                <CompactItem
                  title={project.title}
                  subtitle={project.bio}
                  imageUrl={project.imageUrl}
                  onEdit={() => editor.openExisting(i)}
                  dragProps={handleProps}
                />
              )}
            </ReorderableList>
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
          <ProjectSubForm
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
