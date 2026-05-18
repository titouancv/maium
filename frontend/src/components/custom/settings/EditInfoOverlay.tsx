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
import { Button, ChipList, TextInput, TextArea } from "@/components/ui";
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
  | "educationalExperiences"
  | "personalExperiences"
  | "socialNetworks"
  | "hobbies"
  | "skills"
  | "projects";

interface Props {
  field: EditableField;
  user: UserData;
  onClose: () => void;
  onSaved: () => void;
}

const hobbySchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500),
});
type HobbyData = z.infer<typeof hobbySchema>;

interface HobbySubFormProps {
  initialData?: HobbyData;
  onSave: (data: HobbyData) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const HobbySubForm = ({
  initialData,
  onSave,
  onCancel,
  onDelete,
}: HobbySubFormProps) => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<HobbyData>({
    resolver: zodResolver(hobbySchema),
    mode: "onChange",
    defaultValues: initialData ?? { title: "", description: "" },
  });

  return (
    <StepLayout
      title={t("editHobbies")}
      step={1}
      totalSteps={1}
      isCancelable
      onCancel={onCancel}
      cancelLabel={tCommon("cancelButton")}
      primaryLabel={t("saveButton")}
      formId={SIGNUP_FORM_ID}
      primaryDisabled={!isValid}
      secondaryLabel={onDelete ? t("deleteButton") : undefined}
      onSecondary={onDelete}
    >
      <form
        id={SIGNUP_FORM_ID}
        onSubmit={handleSubmit(onSave)}
        className="flex flex-col gap-4"
      >
        <TextInput
          placeholder={t("hobbyTitlePlaceholder")}
          autoFocus
          {...register("title")}
        />
        <TextArea
          placeholder={t("hobbyDescriptionPlaceholder")}
          {...register("description")}
        />
      </form>
    </StepLayout>
  );
};

export const EditInfoOverlay = ({ field, user, onClose, onSaved }: Props) => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingExperienceIndex, setEditingExperienceIndex] = useState<
    number | "new" | null
  >(null);

  const [strItems, setStrItems] = useState<string[]>(
    field === "skills"
      ? (user.skills ?? [])
      : field === "socialNetworks"
        ? (user.social_networks ?? [])
        : field === "projects"
          ? (user.projects ?? [])
          : [],
  );
  const [strDraft, setStrDraft] = useState("");
  const [strDraftError, setStrDraftError] = useState<string | null>(null);

  const [hobbyItems, setHobbyItems] = useState<HobbyData[]>(user.hobbies ?? []);
  const [editingHobbyIndex, setEditingHobbyIndex] = useState<
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
        : field === "educationalExperiences"
          ? (user.educational_experiences ?? [])
          : (user.personal_experiences ?? [])
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
    "personalExperiences",
  ].includes(field);
  const isSkillsField = field === "skills";
  const isUrlListField = ["socialNetworks", "projects"].includes(field);
  const isHobbiesField = field === "hobbies";

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
        : field === "educationalExperiences"
          ? "educationalExperiences"
          : "personalExperiences";
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

  const handleAddStrItem = () => {
    const val = strDraft.trim();
    if (!val) return;
    if (isUrlListField) {
      const result = z.url().safeParse(val);
      if (!result.success) {
        setStrDraftError(t("urlInvalid"));
        return;
      }
    }
    setStrItems([...strItems, val]);
    setStrDraft("");
    setStrDraftError(null);
  };

  const handleSaveStrItems = () => {
    if (field === "skills") save({ skills: strItems });
    else if (field === "socialNetworks") save({ socialNetworks: strItems });
    else if (field === "projects") save({ projects: strItems });
  };

  const handleHobbySave = (data: HobbyData) => {
    if (editingHobbyIndex === "new") {
      setHobbyItems([...hobbyItems, data]);
    } else if (typeof editingHobbyIndex === "number") {
      setHobbyItems(
        hobbyItems.map((h, i) => (i === editingHobbyIndex ? data : h)),
      );
    }
    setEditingHobbyIndex(null);
  };

  const handleHobbyDelete = () => {
    if (typeof editingHobbyIndex === "number") {
      setHobbyItems(hobbyItems.filter((_, i) => i !== editingHobbyIndex));
    }
    setEditingHobbyIndex(null);
  };

  const namespace =
    field === "educationalExperiences"
      ? "experience.educational"
      : "experience.professional";

  const primaryHandler = isTextInputField
    ? handleTextSave
    : isExperienceField
      ? handleSaveExperiences
      : isSkillsField || isUrlListField
        ? handleSaveStrItems
        : isHobbiesField
          ? () => save({ hobbies: hobbyItems })
          : undefined;

  const primaryDisabled = isSimpleStepField
    ? !isFormValid
    : isTextInputField
      ? !isTextValid
      : false;

  const secondaryLabel =
    isExperienceField || isHobbiesField
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
    : isHobbiesField
      ? () => setEditingHobbyIndex("new")
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
    personalExperiences: t("editPersonalExperiences"),
    socialNetworks: t("editSocialNetworks"),
    hobbies: t("editHobbies"),
    skills: t("editSkills"),
    projects: t("editProjects"),
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

  if (isHobbiesField && editingHobbyIndex !== null) {
    return (
      <div className="bg-surface-50 fixed inset-0 z-50">
        <HobbySubForm
          initialData={
            typeof editingHobbyIndex === "number"
              ? hobbyItems[editingHobbyIndex]
              : undefined
          }
          onSave={handleHobbySave}
          onCancel={() => setEditingHobbyIndex(null)}
          onDelete={
            typeof editingHobbyIndex === "number"
              ? handleHobbyDelete
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="bg-surface-50 fixed inset-0 z-50">
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
        {isSkillsField && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-2">
              <TextInput
                placeholder={t("skills")}
                value={strDraft}
                onChange={(e) => {
                  setStrDraft(e.target.value);
                  setStrDraftError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddStrItem();
                  }
                }}
                infoLabel={strDraftError ?? ""}
                infoType={strDraftError ? "error" : "info"}
              />
              <Button
                variant="outline"
                type="button"
                className="mt-1 shrink-0"
                onClick={handleAddStrItem}
              >
                {tCommon("addButton")}
              </Button>
            </div>
            <ChipList
              items={strItems}
              onRemove={(i) =>
                setStrItems(strItems.filter((_, idx) => idx !== i))
              }
              emptyLabel={t("noSkills")}
            />
          </div>
        )}
        {isUrlListField && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-2">
              <TextInput
                placeholder="https://..."
                value={strDraft}
                onChange={(e) => {
                  setStrDraft(e.target.value);
                  setStrDraftError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddStrItem();
                  }
                }}
                infoLabel={strDraftError ?? ""}
                infoType={strDraftError ? "error" : "info"}
              />
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="mt-1 shrink-0"
                onClick={handleAddStrItem}
              >
                {tCommon("addButton")}
              </Button>
            </div>
            {strItems.length === 0 ? (
              <p className="text-txt-muted text-sm">
                {field === "socialNetworks"
                  ? t("noSocialNetworks")
                  : t("noProjects")}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {strItems.map((url, i) => (
                  <li
                    key={`${url}-${i}`}
                    className="border-brd-200 flex items-center justify-between gap-2 rounded-xl border p-3"
                  >
                    <span className="text-txt truncate text-sm">{url}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setStrItems(strItems.filter((_, idx) => idx !== i))
                      }
                      className="text-txt-muted hover:text-error shrink-0 transition-colors"
                      aria-label="Remove"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 8 8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      >
                        <line x1="1" y1="1" x2="7" y2="7" />
                        <line x1="7" y1="1" x2="1" y2="7" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {isHobbiesField &&
          (hobbyItems.length === 0 ? (
            <p className="text-txt-muted text-sm">{t("noHobbies")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {hobbyItems.map((hobby, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setEditingHobbyIndex(i)}
                    className="border-brd-200 flex w-full items-center justify-between rounded-xl border p-3 text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-txt font-medium">{hobby.title}</p>
                      {hobby.description && (
                        <p className="text-txt-muted truncate text-sm">
                          {hobby.description}
                        </p>
                      )}
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-txt-muted ml-2 h-4 w-4 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          ))}
        {error && <p className="text-error mt-4 text-sm">{error}</p>}
      </StepLayout>
    </div>
  );
};
