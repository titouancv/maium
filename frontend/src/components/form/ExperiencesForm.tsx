"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { ExperienceList } from "@/components/ui/custom/experience";
import { ExperienceSubForm, emptySubValues } from "./sub-form";
import type { SubValues } from "./sub-form";
import type { Experience } from "@/types/experience";

interface ExperiencesFormProps {
  namespace: string;
  dateMode?: "MM-YYYY" | "YYYY";
  defaultExperiences?: Experience[];
  onChange: (experiences: Experience[]) => void;
  onSubFormChange?: (active: boolean) => void;
}

type ItemRecord = Record<string, string>;
type FormItems = { items: ItemRecord[] };

export const ExperiencesForm = ({
  namespace,
  dateMode = "MM-YYYY",
  defaultExperiences,
  onChange,
  onSubFormChange,
}: ExperiencesFormProps) => {
  const tCommon = useTranslations("common");
  const [editingIndex, setEditingIndex] = useState<number | "new" | null>(null);

  const { control, getValues } = useForm<FormItems>({
    defaultValues: {
      items: (defaultExperiences ?? []).map((e) => ({
        organization: e.organization ?? "",
        role: e.role ?? "",
        startPeriod: e.startPeriod ?? "",
        endPeriod: e.endPeriod ?? "",
        description: e.description ?? "",
        website: e.website ?? "",
        location: e.location ?? "",
      })),
    },
  });

  const { fields, append, update, remove } = useFieldArray({
    control,
    name: "items",
  });

  const notifyChange = () => {
    const items = getValues("items");
    onChange(
      items.map((item) => ({
        organization: item.organization,
        role: item.role,
        startPeriod: item.startPeriod,
        endPeriod: item.endPeriod || undefined,
        description: item.description || undefined,
        website: item.website || undefined,
        location: item.location || undefined,
      })),
    );
  };

  const openSubForm = (index: number | "new") => {
    setEditingIndex(index);
    onSubFormChange?.(true);
  };

  const closeSubForm = () => {
    setEditingIndex(null);
    onSubFormChange?.(false);
  };

  const handleSave = (values: SubValues) => {
    const entry = {
      organization: values.organization,
      role: values.role,
      startPeriod: values.startPeriod,
      endPeriod: values.endPeriod,
      description: values.description,
      website: values.website,
      location: values.location,
    };
    if (editingIndex === "new") append(entry);
    else if (typeof editingIndex === "number") update(editingIndex, entry);
    closeSubForm();
    notifyChange();
  };

  const handleDelete = () => {
    if (typeof editingIndex === "number") remove(editingIndex);
    closeSubForm();
    notifyChange();
  };

  if (editingIndex !== null) {
    const initialValues =
      editingIndex === "new"
        ? emptySubValues()
        : (() => {
            const item = getValues("items")[editingIndex];
            return {
              organization: item.organization ?? "",
              role: item.role ?? "",
              startPeriod: item.startPeriod ?? "",
              endPeriod: item.endPeriod ?? "",
              description: item.description ?? "",
              website: item.website ?? "",
              location: item.location ?? "",
            };
          })();

    return (
      <ExperienceSubForm
        namespace={namespace}
        dateMode={dateMode}
        initialValues={initialValues}
        isDeletable={typeof editingIndex === "number"}
        onSave={handleSave}
        onCancel={closeSubForm}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {fields.length === 0 ? (
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
        <ExperienceList
          fields={fields}
          control={control}
          getDisplay={(item) => ({
            organization: item.organization ?? "",
            role: item.role ?? "",
            startPeriod: item.startPeriod ?? "",
            endPeriod: item.endPeriod || undefined,
            description: item.description ?? "",
            website: item.website ?? "",
            location: item.location ?? "",
          })}
          onEdit={(index) => openSubForm(index)}
        />
      )}
    </div>
  );
};
