"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { API, SIGNUP_FORM_ID } from "@/constants";
import { LocationInput } from "@/components/ui/LocationInput";
import { NationalityInput } from "@/components/ui/NationalityInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { StepLayout } from "@/components/layout/StepLayout";
import { StepName, StepPseudo, StepDob } from "@/components/custom/signup";
import {
  ExperienceList,
  ExperienceSubWizard,
} from "@/components/custom/experience";
import type { UserData } from "@/types/user";
import type { ExperienceFormData } from "@/types/experience";
import type { UserState } from "@/stores/useUserStore";

export type EditableField =
  | "name"
  | "pseudo"
  | "dob"
  | "phone"
  | "nationality"
  | "location"
  | "professionalExperiences"
  | "educationalExperiences";

interface Props {
  field: EditableField;
  user: UserData;
  onClose: () => void;
  onSaved: () => void;
}

export const EditInfoOverlay = ({ field, user, onClose, onSaved }: Props) => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingExperienceIndex, setEditingExperienceIndex] = useState<
    number | "new" | null
  >(null);

  const textSchema = z.object({ value: z.string().min(1) });
  const {
    control: textControl,
    handleSubmit: handleTextSubmit,
    formState: { isValid: isTextValid },
  } = useForm({
    resolver: zodResolver(textSchema),
    mode: "onChange",
    defaultValues: {
      value:
        field === "phone"
          ? (user.phone ?? "")
          : field === "nationality"
            ? (user.nationality ?? "")
            : (user.location ?? ""),
    },
  });

  const { control: expControl, getValues: getExpValues } = useForm<{
    items: Record<string, string>[];
  }>({
    defaultValues: {
      items: (field === "professionalExperiences"
        ? (user.professional_experiences ?? [])
        : (user.educational_experiences ?? [])
      ).map((e) => ({
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
  const {
    fields: expFields,
    append: appendExp,
    update: updateExp,
    remove: removeExp,
  } = useFieldArray({ control: expControl, name: "items" });

  const isSimpleStepField = ["name", "pseudo", "dob"].includes(field);
  const isTextInputField = ["phone", "nationality", "location"].includes(field);
  const isExperienceField = [
    "professionalExperiences",
    "educationalExperiences",
  ].includes(field);

  const save = async (payload: Record<string, unknown>) => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(API.USERS_ME, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError((data.error as string) ?? t("saveError"));
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError(t("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleName = (d: Partial<UserState>) =>
    save({ firstName: d.firstName, lastName: d.lastName });

  const handlePseudo = (d: Partial<UserState>) => save({ pseudo: d.pseudo });

  const handleDob = (d: Partial<UserState>) => save({ dob: d.dob });

  const handleTextSave = () =>
    handleTextSubmit(({ value }) => save({ [field]: value }))();

  const handleSaveExperiences = () => {
    const key =
      field === "professionalExperiences"
        ? "professionalExperiences"
        : "educationalExperiences";
    save({
      [key]: getExpValues("items").map((item) => ({
        organization: item.organization,
        role: item.role,
        startPeriod: item.startPeriod,
        endPeriod: item.endPeriod || undefined,
        description: item.description || undefined,
        website: item.website || undefined,
        location: item.location || undefined,
      })),
    });
  };

  const handleExperienceSave = (data: ExperienceFormData) => {
    const entry = {
      organization: data.organization,
      role: data.role,
      startPeriod: data.startPeriod,
      endPeriod: data.endPeriod ?? "",
      description: data.description ?? "",
      website: data.website ?? "",
      location: data.location ?? "",
    };
    if (editingExperienceIndex === "new") {
      appendExp(entry);
    } else if (typeof editingExperienceIndex === "number") {
      updateExp(editingExperienceIndex, entry);
    }
    setEditingExperienceIndex(null);
  };

  const handleExperienceDelete = () => {
    if (typeof editingExperienceIndex === "number") {
      removeExp(editingExperienceIndex);
    }
    setEditingExperienceIndex(null);
  };

  const namespace =
    field === "educationalExperiences"
      ? "experience.educational"
      : "experience.professional";

  const primaryHandler = isTextInputField
    ? handleTextSave
    : isExperienceField
      ? handleSaveExperiences
      : undefined;

  const primaryDisabled = isSimpleStepField
    ? !isFormValid
    : isTextInputField
      ? !isTextValid
      : false;

  const secondaryLabel = isExperienceField
    ? tCommon("addButton")
    : isTextInputField
      ? t("deleteButton")
      : undefined;

  const textFieldHasValue =
    field === "phone"
      ? !!user.phone
      : field === "nationality"
        ? !!user.nationality
        : !!user.location;

  const secondaryHandler = isExperienceField
    ? () => setEditingExperienceIndex("new")
    : isTextInputField && textFieldHasValue
      ? () => save({ [field]: null })
      : undefined;

  const overlayTitle: Record<EditableField, string> = {
    name: t("editName"),
    pseudo: t("editPseudo"),
    dob: t("editDob"),
    phone: t("editPhone"),
    nationality: t("editNationality"),
    location: t("editLocation"),
    professionalExperiences: t("editProfessionalExperiences"),
    educationalExperiences: t("editEducationalExperiences"),
  };

  if (isExperienceField && editingExperienceIndex !== null) {
    return (
      <div className="bg-surface-50 fixed inset-0 z-50">
        <ExperienceSubWizard
          namespace={namespace}
          dateMode="MM-YYYY"
          initialData={
            typeof editingExperienceIndex === "number"
              ? (() => {
                  const item = getExpValues("items")[editingExperienceIndex];
                  return {
                    organization: item.organization,
                    role: item.role,
                    startPeriod: item.startPeriod,
                    endPeriod: item.endPeriod || undefined,
                    description: item.description || undefined,
                    website: item.website || undefined,
                    location: item.location || undefined,
                  };
                })()
              : undefined
          }
          onSave={handleExperienceSave}
          onCancel={() => setEditingExperienceIndex(null)}
          onDelete={
            typeof editingExperienceIndex === "number"
              ? handleExperienceDelete
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="bg-surface-50 fixed inset-0 z-50 px-6">
      <StepLayout
        title={overlayTitle[field]}
        step={1}
        totalSteps={1}
        isCancelable
        onCancel={onClose}
        cancelLabel={tCommon("cancelButton")}
        primaryLabel={t("saveButton")}
        formId={isSimpleStepField ? SIGNUP_FORM_ID : undefined}
        onPrimary={primaryHandler}
        primaryDisabled={primaryDisabled}
        primaryLoading={isSaving}
        secondaryLabel={secondaryLabel}
        onSecondary={secondaryHandler}
        centerContent={
          field === "location" || field === "nationality" ? false : undefined
        }
      >
        {field === "name" && (
          <StepName
            onNext={handleName}
            defaultFirstName={user.first_name}
            defaultLastName={user.last_name}
            onValidityChange={setIsFormValid}
          />
        )}
        {field === "pseudo" && (
          <StepPseudo
            onNext={handlePseudo}
            defaultPseudo={user.pseudo}
            onValidityChange={setIsFormValid}
          />
        )}
        {field === "dob" && (
          <StepDob
            onNext={handleDob}
            defaultDob={user.dob}
            onValidityChange={setIsFormValid}
          />
        )}
        {field === "phone" && (
          <Controller
            control={textControl}
            name="value"
            render={({ field: f }) => (
              <PhoneInput
                value={f.value}
                onChange={f.onChange}
                onBlur={f.onBlur}
                autoFocus
              />
            )}
          />
        )}
        {field === "nationality" && (
          <Controller
            control={textControl}
            name="value"
            render={({ field: f }) => (
              <NationalityInput
                placeholder={t("nationalityPlaceholder")}
                value={f.value}
                onChange={f.onChange}
                onBlur={f.onBlur}
                autoFocus
              />
            )}
          />
        )}
        {field === "location" && (
          <Controller
            control={textControl}
            name="value"
            render={({ field: f }) => (
              <LocationInput
                placeholder={t("locationPlaceholder")}
                value={f.value}
                onChange={f.onChange}
                onBlur={f.onBlur}
                autoFocus
              />
            )}
          />
        )}
        {isExperienceField &&
          (expFields.length === 0 ? (
            <p className="text-txt-muted text-sm">{t("noExperiences")}</p>
          ) : (
            <ExperienceList
              fields={expFields}
              control={expControl}
              getDisplay={(item) => ({
                organization: item.organization ?? "",
                role: item.role ?? "",
                startPeriod: item.startPeriod ?? "",
                endPeriod: item.endPeriod || undefined,
                description: item.description ?? "",
                website: item.website ?? "",
                location: item.location ?? "",
              })}
              onEdit={(index) => setEditingExperienceIndex(index)}
            />
          ))}
        {error && <p className="text-error mt-4 text-sm">{error}</p>}
      </StepLayout>
    </div>
  );
};
