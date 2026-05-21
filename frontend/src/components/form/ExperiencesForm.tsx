"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { ExperienceSubForm, emptySubValues } from "./sub-form";
import type { SubValues } from "./sub-form";
import type { Experience } from "@/types/experience";
import { ExperienceList } from "../custom";

interface ExperiencesFormProps {
  namespace: string;
  dateMode?: "MM-YYYY" | "YYYY";
  defaultValue?: Experience[];
  onChange: (experiences: Experience[]) => void;
}

type ItemRecord = Record<string, string>;
type FormItems = { items: ItemRecord[] };

export const ExperiencesForm = ({
  namespace,
  dateMode = "MM-YYYY",
  defaultValue,
  onChange,
}: ExperiencesFormProps) => {
  const tCommon = useTranslations("common");
  const [editingIndex, setEditingIndex] = useState<number | "new" | null>(null);

  const { control, getValues } = useForm<FormItems>({
    defaultValues: {
      items: (defaultValue ?? []).map((e) => ({
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

  const openSubForm = (index: number | "new") => setEditingIndex(index);
  const closeSubForm = () => setEditingIndex(null);

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

  const subFormInitialValues =
    editingIndex === null
      ? null
      : editingIndex === "new"
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
    <>
      {fields.length === 0 ? (
        <div className="flex h-full w-full flex-col justify-center">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full self-start"
            onClick={() => openSubForm("new")}
          >
            {tCommon("addButton")}
          </Button>
        </div>
      ) : (
        <div className="flex h-full w-full flex-col justify-between gap-4">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
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
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full self-start"
            onClick={() => openSubForm("new")}
          >
            {tCommon("addButton")}
          </Button>
        </div>
      )}
      {subFormInitialValues !== null && (
        <div className="bg-surface-50 fixed inset-0 z-50">
          <ExperienceSubForm
            namespace={namespace}
            dateMode={dateMode}
            initialValues={subFormInitialValues}
            isDeletable={typeof editingIndex === "number"}
            onSave={handleSave}
            onCancel={closeSubForm}
            onDelete={handleDelete}
          />
        </div>
      )}
    </>
  );
};
