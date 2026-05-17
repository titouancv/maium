"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { API, SIGNUP_FORM_ID } from "@/constants";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Title } from "@/components/ui/Title";
import { StepName, StepPseudo, StepDob } from "@/components/custom/signup";
import { ExperienceItem, ExperienceSubWizard } from "@/components/custom/experience";
import type { UserData } from "@/types/user";
import type { Experience, ExperienceFormData } from "@/types/experience";
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
  const [experiences, setExperiences] = useState<Experience[]>(
    field === "professionalExperiences"
      ? (user.professional_experiences ?? [])
      : (user.educational_experiences ?? []),
  );
  const [editingExperienceIndex, setEditingExperienceIndex] = useState<
    number | "new" | null
  >(null);

  const textSchema = z.object({ value: z.string().min(1) });
  const {
    register: registerText,
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
    save({ [key]: experiences });
  };

  const handleExperienceSave = (data: ExperienceFormData) => {
    const entry: Experience = { ...data, endPeriod: data.endPeriod || undefined };
    if (editingExperienceIndex === "new") {
      setExperiences((prev) => [...prev, entry]);
    } else if (typeof editingExperienceIndex === "number") {
      setExperiences((prev) =>
        prev.map((e, i) => (i === editingExperienceIndex ? entry : e)),
      );
    }
    setEditingExperienceIndex(null);
  };

  const handleExperienceDelete = () => {
    if (typeof editingExperienceIndex === "number") {
      setExperiences((prev) =>
        prev.filter((_, i) => i !== editingExperienceIndex),
      );
    }
    setEditingExperienceIndex(null);
  };

  const namespace =
    field === "educationalExperiences"
      ? "experience.educational"
      : "experience.professional";

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

  const textPlaceholder: Partial<Record<EditableField, string>> = {
    phone: t("phonePlaceholder"),
    nationality: t("nationalityPlaceholder"),
    location: t("locationPlaceholder"),
  };

  if (isExperienceField && editingExperienceIndex !== null) {
    return (
      <div className="fixed inset-0 z-50 bg-surface-50">
        <ExperienceSubWizard
          namespace={namespace}
          dateMode="MM-YYYY"
          initialData={
            typeof editingExperienceIndex === "number"
              ? experiences[editingExperienceIndex]
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
    <div className="fixed inset-0 z-50 flex flex-col bg-surface-50">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-6 pt-16">
        <Title label={overlayTitle[field]} size="h1" />
        <Button variant="ghost" type="button" size="sm" onClick={onClose}>
          {tCommon("cancelButton")}
        </Button>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-10 pb-32">
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
        {isTextInputField && (
          <TextInput
            placeholder={textPlaceholder[field] ?? ""}
            inputMode="text"
            autoFocus
            {...registerText("value")}
          />
        )}
        {isExperienceField && (
          <div className="flex flex-col gap-4">
            {experiences.length === 0 ? (
              <p className="text-sm text-txt-muted">{t("noExperiences")}</p>
            ) : (
              <div className="flex flex-col gap-4">
                {experiences.map((exp, i) => (
                  <ExperienceItem
                    key={i}
                    {...exp}
                    description={exp.description ?? ""}
                    website={exp.website ?? ""}
                    location={exp.location ?? ""}
                    onEdit={() => setEditingExperienceIndex(i)}
                  />
                ))}
              </div>
            )}
            <Button
              variant="outline"
              type="button"
              onClick={() => setEditingExperienceIndex("new")}
            >
              {tCommon("addButton")}
            </Button>
          </div>
        )}
        {error && <p className="mt-4 text-sm text-error">{error}</p>}
      </div>

      {/* Footer */}
      <div
        className="fixed inset-x-0 px-6 pb-8"
        style={{ bottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {isExperienceField ? (
          <Button
            variant="primary"
            type="button"
            size="lg"
            className="w-full"
            onClick={handleSaveExperiences}
            isLoading={isSaving}
          >
            {t("saveButton")}
          </Button>
        ) : isTextInputField ? (
          <Button
            variant="primary"
            type="button"
            size="lg"
            className="w-full"
            onClick={handleTextSave}
            disabled={!isTextValid}
            isLoading={isSaving}
          >
            {t("saveButton")}
          </Button>
        ) : (
          <Button
            type="submit"
            form={SIGNUP_FORM_ID}
            size="lg"
            className="w-full"
            disabled={isSimpleStepField && !isFormValid}
            isLoading={isSaving}
          >
            {t("saveButton")}
          </Button>
        )}
      </div>
    </div>
  );
};
