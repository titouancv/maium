"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Form } from "../Form";
import type { FormProps } from "../Form";
import type { HobbyData } from "@/types/user";

interface Props {
  initialData?: HobbyData;
  onSave: (data: HobbyData) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const TOTAL_SUB_STEPS = 2;

export const HobbySubForm = ({
  initialData,
  onSave,
  onCancel,
  onDelete,
}: Props) => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [subStep, setSubStep] = useState(1);
  const [values, setValues] = useState<HobbyData>(
    initialData ?? { title: "", description: "" },
  );
  const [titleError, setTitleError] = useState<string | undefined>();

  const base = {
    step: subStep,
    totalSteps: TOTAL_SUB_STEPS,
    isCancelable: true,
    onCancel,
    cancelLabel: tCommon("cancelButton"),
    primaryLabel:
      subStep < TOTAL_SUB_STEPS ? tCommon("nextButton") : t("saveButton"),
    secondaryLabel: onDelete ? t("deleteButton") : undefined,
    onSecondary: onDelete,
  };

  const getFormProps = (): FormProps => {
    if (subStep === 1) {
      return {
        ...base,
        type: "hobbyWikipedia",
        title: t("hobbySubStep1Title"),
        defaultValue: values.title ? values : undefined,
        onChange: ({ title, imageUrl, sourceUrl }) => {
          setValues((prev) => ({ ...prev, title, imageUrl, sourceUrl }));
          setTitleError(undefined);
        },
        infoLabel: titleError,
        infoType: titleError ? "error" : "info",
        onPrimary: () => {
          if (!values.title.trim()) {
            setTitleError(t("hobbyTitleRequired"));
            return;
          }
          setSubStep(2);
        },
      };
    }

    return {
      ...base,
      type: "longText",
      title: t("hobbySubStep2Title"),
      placeholder: t("hobbyDescriptionPlaceholder"),
      defaultValue: values.description,
      onChange: (v) => setValues((prev) => ({ ...prev, description: v })),
      onPrimary: () => onSave(values),
    };
  };

  return <Form key={subStep} {...getFormProps()} />;
};
