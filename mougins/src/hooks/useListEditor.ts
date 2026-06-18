"use client";

import { useState } from "react";

export type EditingIndex = number | "new" | null;

export function useListEditor() {
  const [editingIndex, setEditingIndex] = useState<EditingIndex>(null);

  return {
    editingIndex,
    isEditing: editingIndex !== null,
    isEditingExisting: typeof editingIndex === "number",
    openNew: () => setEditingIndex("new"),
    openExisting: (i: number) => setEditingIndex(i),
    close: () => setEditingIndex(null),
  };
}
