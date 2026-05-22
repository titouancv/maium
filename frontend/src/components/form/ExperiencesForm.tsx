"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { ExperienceSubForm, emptySubValues } from "./sub-form";
import type { SubValues } from "./sub-form";
import type { Experience, ExperienceFormItems } from "@/types/experience";
import { ExperienceList } from "../custom";
import type { ExperienceNamespace } from "@/constants";
import { useListEditor } from "@/hooks";

interface ExperiencesFormProps {
  namespace: ExperienceNamespace;
  dateMode?: "MM-YYYY" | "YYYY";
  defaultValue?: Experience[];
  onChange: (experiences: Experience[]) => void;
}

export const ExperiencesForm = ({
  namespace,
  dateMode = "MM-YYYY",
  defaultValue,
  onChange,
}: ExperiencesFormProps) => {
  const tCommon = useTranslations("common");
  const editor = useListEditor();

  const { control, getValues } = useForm<ExperienceFormItems>({
    defaultValues: {
      items: (defaultValue ?? []).map((e) => ({
        organization: e.organization ?? "",
        role: e.role ?? "",
        startPeriod: String(e.startPeriod),
        endPeriod: e.endPeriod != null ? String(e.endPeriod) : "",
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
        startPeriod: Number(item.startPeriod),
        endPeriod: item.endPeriod ? Number(item.endPeriod) : undefined,
        description: item.description || undefined,
        website: item.website || undefined,
        location: item.location || undefined,
      })),
    );
  };

  const handleSave = (values: SubValues) => {
    const entry = {
      organization: values.organization,
      role: values.role,
      startPeriod: values.startPeriod != null ? String(values.startPeriod) : "",
      endPeriod: values.endPeriod != null ? String(values.endPeriod) : "",
      description: values.description,
      website: values.website,
      location: values.location,
    };
    if (editor.editingIndex === "new") append(entry);
    else if (typeof editor.editingIndex === "number")
      update(editor.editingIndex, entry);
    editor.close();
    notifyChange();
  };

  const handleDelete = () => {
    if (typeof editor.editingIndex === "number") remove(editor.editingIndex);
    editor.close();
    notifyChange();
  };

  const subFormInitialValues =
    editor.editingIndex === null
      ? null
      : editor.editingIndex === "new"
        ? emptySubValues()
        : (() => {
            const item = getValues("items")[editor.editingIndex];
            return {
              organization: item.organization ?? "",
              role: item.role ?? "",
              startPeriod: item.startPeriod ? Number(item.startPeriod) : null,
              endPeriod: item.endPeriod ? Number(item.endPeriod) : null,
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
            onClick={editor.openNew}
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
                startPeriod: Number(item.startPeriod),
                endPeriod: item.endPeriod ? Number(item.endPeriod) : undefined,
                description: item.description ?? "",
                website: item.website ?? "",
                location: item.location ?? "",
              })}
              onEdit={editor.openExisting}
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
      {subFormInitialValues !== null && (
        <div className="bg-surface-50 fixed inset-0 z-50">
          <ExperienceSubForm
            namespace={namespace}
            dateMode={dateMode}
            initialValues={subFormInitialValues}
            isDeletable={editor.isEditingExisting}
            onSave={handleSave}
            onCancel={editor.close}
            onDelete={handleDelete}
          />
        </div>
      )}
    </>
  );
};
