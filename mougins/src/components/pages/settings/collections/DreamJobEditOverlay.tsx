"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SIGNUP_FORM_ID, type DreamWorkMode } from "@/constants";
import { updateProfile } from "@/lib/users/updateProfile";
import { Overlay } from "@/components/ui/Overlay";
import { FormLayout } from "@/components/layout/FormLayout";
import { Form } from "@/components/form";
import type { FormProps } from "@/components/form";
import type { UserData } from "@/types/user";
import { DreamJobCompanyTypesField } from "./DreamJobCompanyTypesField";
import { DreamJobWorkModeField } from "./DreamJobWorkModeField";
import { DreamJobSalaryField } from "./DreamJobSalaryField";

export type DreamJobField =
  | "companyTypes"
  | "workMode"
  | "location"
  | "salary"
  | "industries"
  | "companyValues";

interface Props {
  field: DreamJobField;
  user: UserData;
  onClose: () => void;
  onSaved: () => void;
}

export const DreamJobEditOverlay = ({ field, user, onClose, onSaved }: Props) => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tDreamJob = useTranslations("dreamJob");

  const [isSaving, setIsSaving] = useState(false);
  const [companyTypes, setCompanyTypes] = useState<string[]>(
    user.dream_company_types ?? [],
  );
  const [workMode, setWorkMode] = useState<DreamWorkMode | null>(
    user.dream_work_mode ?? "flexible",
  );
  const [salary, setSalary] = useState(
    user.dream_salary ? String(user.dream_salary) : "",
  );
  const [industries, setIndustries] = useState<string[]>(
    user.dream_industries ?? [],
  );
  const [companyValues, setCompanyValues] = useState(
    user.dream_company_values ?? "",
  );

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

  if (field === "companyTypes") {
    return (
      <Overlay onClose={onClose}>
        <FormLayout
          title={tDreamJob("companyTypesLabel")}
          {...base}
          onPrimary={() => save({ dreamCompanyTypes: companyTypes })}
        >
          <DreamJobCompanyTypesField
            value={companyTypes}
            onChange={setCompanyTypes}
          />
        </FormLayout>
      </Overlay>
    );
  }

  if (field === "workMode") {
    return (
      <Overlay onClose={onClose}>
        <FormLayout
          title={tDreamJob("workModeLabel")}
          {...base}
          onPrimary={() => save({ dreamWorkMode: workMode })}
        >
          <DreamJobWorkModeField value={workMode} onChange={setWorkMode} />
        </FormLayout>
      </Overlay>
    );
  }

  if (field === "salary") {
    return (
      <Overlay onClose={onClose}>
        <FormLayout
          title={tDreamJob("salaryLabel")}
          {...base}
          onPrimary={() => {
            const trimmed = salary.trim();
            const parsed =
              trimmed === "" ? null : Number.parseInt(trimmed, 10);
            const value =
              parsed !== null && Number.isFinite(parsed) ? parsed : null;
            save({ dreamSalary: value });
          }}
        >
          <DreamJobSalaryField value={salary} onChange={setSalary} />
        </FormLayout>
      </Overlay>
    );
  }

  const getFormProps = (): FormProps => {
    switch (field) {
      case "location":
        return {
          ...base,
          type: "location",
          formId: SIGNUP_FORM_ID,
          title: tDreamJob("locationLabel"),
          format: "city-country",
          defaultValue: user.dream_location ?? "",
          onChange: (d) => save({ dreamLocation: d.location || null }),
        };
      case "industries":
        return {
          ...base,
          type: "keys",
          title: tDreamJob("industriesLabel"),
          placeholder: tDreamJob("industriesPlaceholder"),
          defaultValue: user.dream_industries ?? [],
          onChange: (items) => setIndustries(items),
          onPrimary: () => save({ dreamIndustries: industries }),
        };
      case "companyValues":
      default:
        return {
          ...base,
          type: "longText",
          title: tDreamJob("companyValuesLabel"),
          placeholder: tDreamJob("companyValuesPlaceholder"),
          defaultValue: user.dream_company_values ?? "",
          onChange: (v) => setCompanyValues(v),
          onPrimary: () => save({ dreamCompanyValues: companyValues || null }),
        };
    }
  };

  return (
    <Overlay onClose={onClose}>
      <Form {...getFormProps()} />
    </Overlay>
  );
};
