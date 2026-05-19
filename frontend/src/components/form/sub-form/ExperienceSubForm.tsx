"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Form } from "../Form";
import { SIGNUP_FORM_ID } from "@/constants";

export type SubValues = {
  organization: string;
  role: string;
  startPeriod: string;
  endPeriod: string;
  description: string;
  website: string;
  location: string;
};

export const emptySubValues = (): SubValues => ({
  organization: "",
  role: "",
  startPeriod: "",
  endPeriod: "",
  description: "",
  website: "",
  location: "",
});

const TOTAL_SUB_STEPS = 6;

interface ExperienceSubFormProps {
  namespace: string;
  dateMode?: "MM-YYYY" | "YYYY";
  initialValues: SubValues;
  isDeletable?: boolean;
  onSave: (values: SubValues) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export const ExperienceSubForm = ({
  namespace,
  dateMode = "MM-YYYY",
  initialValues,
  isDeletable = false,
  onSave,
  onCancel,
  onDelete,
}: ExperienceSubFormProps) => {
  const t = useTranslations(namespace);
  const tCommon = useTranslations("common");
  const [subStep, setSubStep] = useState(1);
  const [subValues, setSubValues] = useState<SubValues>(initialValues);
  const [subErrors, setSubErrors] = useState<
    Partial<Record<keyof SubValues, string>>
  >({});

  const advance = () => {
    if (subStep === 1 && !subValues.organization.trim()) {
      setSubErrors({ organization: t("organizationRequired") });
      return;
    }
    if (subStep === 2 && !subValues.role.trim()) {
      setSubErrors({ role: t("roleRequired") });
      return;
    }
    if (subStep === 3 && !subValues.startPeriod) {
      setSubErrors({ startPeriod: t("startPeriodRequired") });
      return;
    }
    setSubErrors({});
    setSubStep((s) => s + 1);
  };

  const baseFormProps = {
    step: subStep,
    totalSteps: TOTAL_SUB_STEPS,
    isCancelable: true,
    onCancel,
    cancelLabel: tCommon("cancelButton"),
    primaryLabel:
      subStep < TOTAL_SUB_STEPS ? tCommon("nextButton") : t("saveButton"),
    secondaryLabel: t("removeEntry"),
    onSecondary: isDeletable ? onDelete : undefined,
  };

  if (subStep === 1)
    return (
      <Form
        {...baseFormProps}
        type="text"
        title={t("subStep1Title")}
        placeholder={t("organizationPlaceholder")}
        defaultValue={subValues.organization}
        onChange={(v) => {
          setSubValues((prev) => ({ ...prev, organization: v }));
          setSubErrors((prev) => ({ ...prev, organization: undefined }));
        }}
        infoLabel={subErrors.organization}
        infoType={subErrors.organization ? "error" : "info"}
        onPrimary={advance}
      />
    );

  if (subStep === 2)
    return (
      <Form
        {...baseFormProps}
        type="text"
        title={t("subStep2Title")}
        placeholder={t("rolePlaceholder")}
        defaultValue={subValues.role}
        onChange={(v) => {
          setSubValues((prev) => ({ ...prev, role: v }));
          setSubErrors((prev) => ({ ...prev, role: undefined }));
        }}
        infoLabel={subErrors.role}
        infoType={subErrors.role ? "error" : "info"}
        onPrimary={advance}
      />
    );

  if (subStep === 3)
    return (
      <Form
        {...baseFormProps}
        type="dateRange"
        title={t("subStep3Title")}
        defaultStartDate={subValues.startPeriod}
        defaultEndDate={subValues.endPeriod}
        mode={dateMode}
        onChange={(start, end) => {
          setSubValues((prev) => ({
            ...prev,
            startPeriod: start,
            endPeriod: end,
          }));
          setSubErrors((prev) => ({ ...prev, startPeriod: undefined }));
        }}
        startError={subErrors.startPeriod}
        onPrimary={advance}
      />
    );

  if (subStep === 4)
    return (
      <Form
        {...baseFormProps}
        type="longText"
        title={t("subStep4Title")}
        placeholder={t("descriptionPlaceholder")}
        defaultValue={subValues.description}
        onChange={(v) => setSubValues((prev) => ({ ...prev, description: v }))}
        rows={10}
        onPrimary={advance}
      />
    );

  if (subStep === 5)
    return (
      <Form
        {...baseFormProps}
        type="text"
        title={t("subStep5Title")}
        placeholder={t("websitePlaceholder")}
        defaultValue={subValues.website}
        onChange={(v) => setSubValues((prev) => ({ ...prev, website: v }))}
        onPrimary={advance}
      />
    );

  return (
    <Form
      {...baseFormProps}
      type="location"
      title={t("subStep6Title")}
      formId={SIGNUP_FORM_ID}
      defaultLocation={subValues.location}
      onNext={({ location }) => onSave({ ...subValues, location })}
    />
  );
};
