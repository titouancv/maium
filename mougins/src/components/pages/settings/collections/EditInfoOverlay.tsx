"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  SIGNUP_FORM_ID,
  EXPERIENCE_NAMESPACE,
  GENDERS,
  type Gender,
} from "@/constants";
import { updateProfile } from "@/lib/users/updateProfile";
import { Overlay } from "@/components/ui/Overlay";
import { Form } from "@/components/form";
import type { FormProps } from "@/components/form";
import type { UserData } from "@/types/user";
import type { Experience } from "@/types/experience";
import { HobbyData, type Project } from "@/types/user";

export type EditableField =
  | "name"
  | "pseudo"
  | "dob"
  | "gender"
  | "phone"
  | "nationality"
  | "location"
  | "bio"
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

export const EditInfoOverlay = ({ field, user, onClose, onSaved }: Props) => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tGender = useTranslations("gender");

  const [isSaving, setIsSaving] = useState(false);
  const [currentGender, setCurrentGender] = useState<Gender>(
    user.gender ?? GENDERS[0],
  );

  const [currentExperiences, setCurrentExperiences] = useState<Experience[]>(
    () => {
      if (field === "professionalExperiences")
        return user.professional_experiences ?? [];
      if (field === "educationalExperiences")
        return user.educational_experiences ?? [];
      if (field === "personalExperiences")
        return user.personal_experiences ?? [];
      return [];
    },
  );
  const [currentStrItems, setCurrentStrItems] = useState<string[]>(() => {
    if (field === "skills") return user.skills ?? [];
    if (field === "socialNetworks") return user.social_networks ?? [];
    return [];
  });
  const [currentHobbies, setCurrentHobbies] = useState<HobbyData[]>(
    user.hobbies ?? [],
  );
  const [currentProjects, setCurrentProjects] = useState<Project[]>(
    user.projects ?? [],
  );
  const [currentBio, setCurrentBio] = useState<string>(user.bio ?? "");

  const save = async (payload: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      if (!(await updateProfile(payload))) return;
      onSaved();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const base = {
    step: 1,
    totalSteps: 1,
    isCancelable: true,
    onCancel: onClose,
    cancelLabel: tCommon("cancelButton"),
    primaryLabel: t("saveButton"),
    primaryLoading: isSaving,
  };

  const getFormProps = (): FormProps => {
    switch (field) {
      case "name":
        return {
          ...base,
          type: "fullName",
          formId: SIGNUP_FORM_ID,
          onChange: (d) =>
            save({ firstName: d.firstName, lastName: d.lastName }),
          defaultValue: {
            firstName: user.first_name,
            lastName: user.last_name,
          },
        };
      case "pseudo":
        return {
          ...base,
          type: "pseudo",
          formId: SIGNUP_FORM_ID,
          onChange: (d) => save({ pseudo: d.pseudo }),
          defaultValue: user.pseudo,
        };
      case "dob":
        return {
          ...base,
          type: "date",
          formId: SIGNUP_FORM_ID,
          onChange: (d) => save({ dob: d.dob }),
          defaultValue: user.dob ?? null,
        };
      case "gender":
        return {
          ...base,
          title: t("editGender"),
          type: "select",
          options: GENDERS.map((value) => ({
            value,
            label: tGender(value),
          })),
          defaultValue: user.gender ?? GENDERS[0],
          onChange: (value) => setCurrentGender(value as Gender),
          onPrimary: () => save({ gender: currentGender }),
        };
      case "phone":
        return {
          ...base,
          type: "phoneNumber",
          formId: SIGNUP_FORM_ID,
          onChange: (d) => save({ phone: d.phone }),
          defaultValue: user.phone ?? "",
          secondaryLabel: user.phone ? t("deleteButton") : undefined,
          onSecondary: user.phone ? () => save({ phone: null }) : undefined,
        };
      case "nationality":
        return {
          ...base,
          title: t("editNationality"),
          type: "location",
          formId: SIGNUP_FORM_ID,
          format: "country",
          onChange: (d) => save({ nationality: d.location }),
          defaultValue: user.nationality ?? "",
          secondaryLabel: user.nationality ? t("deleteButton") : undefined,
          onSecondary: user.nationality
            ? () => save({ nationality: null })
            : undefined,
        };
      case "location":
        return {
          ...base,
          type: "location",
          formId: SIGNUP_FORM_ID,
          onChange: (d) => save({ location: d.location }),
          defaultValue: user.location ?? "",
          secondaryLabel: user.location ? t("deleteButton") : undefined,
          onSecondary: user.location
            ? () => save({ location: null })
            : undefined,
        };
      case "bio":
        return {
          ...base,
          title: t("bio"),
          type: "longText",
          placeholder: t("bioPlaceholder"),
          rows: 10,
          onChange: (v) => setCurrentBio(v ?? ""),
          onPrimary: () => save({ bio: currentBio || null }),
          defaultValue: user.bio ?? "",
        };
      case "professionalExperiences":
        return {
          ...base,
          type: "experiences",
          namespace: EXPERIENCE_NAMESPACE.professional,
          dateMode: "MM-YYYY",
          defaultValue: user.professional_experiences ?? [],
          onChange: (exps) => setCurrentExperiences(exps),
          onPrimary: () =>
            save({ professionalExperiences: currentExperiences }),
        };
      case "educationalExperiences":
        return {
          ...base,
          type: "experiences",
          namespace: EXPERIENCE_NAMESPACE.educational,
          dateMode: "MM-YYYY",
          defaultValue: user.educational_experiences ?? [],
          onChange: (exps) => setCurrentExperiences(exps),
          onPrimary: () => save({ educationalExperiences: currentExperiences }),
        };
      case "personalExperiences":
        return {
          ...base,
          title: t("editPersonalExperiences"),
          type: "experiences",
          namespace: EXPERIENCE_NAMESPACE.professional,
          dateMode: "MM-YYYY",
          defaultValue: user.personal_experiences ?? [],
          onChange: (exps) => setCurrentExperiences(exps),
          onPrimary: () => save({ personalExperiences: currentExperiences }),
        };
      case "skills":
        return {
          ...base,
          type: "keys",
          placeholder: t("skills"),
          defaultValue: user.skills ?? [],
          onChange: (items) => setCurrentStrItems(items),
          onPrimary: () => save({ skills: currentStrItems }),
        };
      case "socialNetworks":
        return {
          ...base,
          type: "socialNetwork",
          defaultValue: user.social_networks ?? [],
          onChange: (items) => setCurrentStrItems(items),
          onPrimary: () => save({ socialNetworks: currentStrItems }),
        };
      case "projects":
        return {
          ...base,
          type: "projects",
          defaultValue: user.projects ?? [],
          onChange: (projects) => setCurrentProjects(projects),
          onPrimary: () => save({ projects: currentProjects }),
        };
      case "hobbies":
        return {
          ...base,
          type: "hobbies",
          defaultValue: user.hobbies ?? [],
          onChange: (hobbies) => setCurrentHobbies(hobbies),
          onPrimary: () => save({ hobbies: currentHobbies }),
        };
    }
  };

  return (
    <Overlay onClose={onClose}>
      <Form {...getFormProps()} />
    </Overlay>
  );
};
