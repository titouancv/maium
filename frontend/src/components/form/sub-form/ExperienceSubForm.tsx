"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Form } from "../Form";
import type { FormProps } from "../Form";
import { SIGNUP_FORM_ID } from "@/constants";

export type SubValues = {
  organization: string;
  role: string;
  startPeriod: number | null;
  endPeriod: number | null;
  description: string;
  website: string;
  location: string;
};

export const emptySubValues = (): SubValues => ({
  organization: "",
  role: "",
  startPeriod: null,
  endPeriod: null,
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

  const base = {
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

  const getFormProps = (): FormProps => {
    switch (subStep) {
      case 1:
        return {
          ...base,
          type: "text",
          title: t("subStep1Title"),
          placeholder: t("organizationPlaceholder"),
          defaultValue: subValues.organization,
          onChange: (v) => {
            setSubValues((prev) => ({ ...prev, organization: v }));
            setSubErrors((prev) => ({ ...prev, organization: undefined }));
          },
          infoLabel: subErrors.organization,
          infoType: subErrors.organization ? "error" : "info",
          onPrimary: advance,
        };
      case 2:
        return {
          ...base,
          type: "text",
          title: t("subStep2Title"),
          placeholder: t("rolePlaceholder"),
          defaultValue: subValues.role,
          onChange: (v) => {
            setSubValues((prev) => ({ ...prev, role: v }));
            setSubErrors((prev) => ({ ...prev, role: undefined }));
          },
          infoLabel: subErrors.role,
          infoType: subErrors.role ? "error" : "info",
          onPrimary: advance,
        };
      case 3:
        return {
          ...base,
          type: "dateRange",
          title: t("subStep3Title"),
          defaultValue: {
            defaultStartDate: subValues.startPeriod,
            defaultEndDate: subValues.endPeriod,
          },
          mode: dateMode,
          onChange: ({ startDate, endDate }) => {
            setSubValues((prev) => ({
              ...prev,
              startPeriod: startDate,
              endPeriod: endDate,
            }));
            setSubErrors((prev) => ({ ...prev, startPeriod: undefined }));
          },
          startError: subErrors.startPeriod,
          onPrimary: advance,
        };
      case 4:
        return {
          ...base,
          type: "longText",
          title: t("subStep4Title"),
          placeholder: t("descriptionPlaceholder"),
          defaultValue: subValues.description,
          onChange: (v) => setSubValues((prev) => ({ ...prev, description: v })),
          rows: 10,
          onPrimary: advance,
        };
      case 5:
        return {
          ...base,
          type: "text",
          title: t("subStep5Title"),
          placeholder: t("websitePlaceholder"),
          defaultValue: subValues.website,
          onChange: (v) => setSubValues((prev) => ({ ...prev, website: v })),
          onPrimary: advance,
        };
      default:
        return {
          ...base,
          type: "location",
          title: t("subStep6Title"),
          formId: SIGNUP_FORM_ID,
          defaultValue: subValues.location,
          onChange: ({ location }) => onSave({ ...subValues, location }),
        };
    }
  };

  return <Form key={subStep} {...getFormProps()} />;
};
