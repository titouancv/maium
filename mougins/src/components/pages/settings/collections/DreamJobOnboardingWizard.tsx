"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { FormLayout } from "@/components/layout/FormLayout";
import { Form } from "@/components/form";
import type { FormProps } from "@/components/form";
import { ROUTES, SIGNUP_FORM_ID, type DreamWorkMode } from "@/constants";
import { updateProfile } from "@/lib/users/updateProfile";
import { useNotificationStore } from "@/stores/useNotificationStore";
import type { UserData } from "@/types";
import { DreamJobCompanyTypesField } from "./DreamJobCompanyTypesField";
import { DreamJobWorkModeField } from "./DreamJobWorkModeField";
import { DreamJobSalaryField } from "./DreamJobSalaryField";

const COMPANY_TYPES_STEP = 1;
const WORK_MODE_STEP = 2;
const LOCATION_STEP = 3;
const SALARY_STEP = 4;
const INDUSTRIES_STEP = 5;
const COMPANY_VALUES_STEP = 6;
const TOTAL_STEPS = 6;

interface Props {
  user: UserData;
  setUser: (user: UserData) => void;
}

export const DreamJobOnboardingWizard = ({ user, setUser }: Props) => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tDreamJob = useTranslations("dreamJob");
  const router = useRouter();
  const notify = useNotificationStore((s) => s.notify);

  const [step, setStep] = useState(COMPANY_TYPES_STEP);
  const [companyTypes, setCompanyTypes] = useState<string[]>(
    user.dream_company_types ?? [],
  );
  const [workMode, setWorkMode] = useState<DreamWorkMode | null>(
    user.dream_work_mode ?? null,
  );
  const [location, setLocation] = useState(user.dream_location ?? "");
  const [salary, setSalary] = useState(
    user.dream_salary ? String(user.dream_salary) : "",
  );
  const [industries, setIndustries] = useState<string[]>(
    user.dream_industries ?? [],
  );
  const [companyValues, setCompanyValues] = useState(
    user.dream_company_values ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    const previous = user;
    const trimmedSalary = salary.trim();
    const parsedSalary =
      trimmedSalary === "" ? null : Number.parseInt(trimmedSalary, 10);
    const salaryValue =
      parsedSalary !== null && Number.isFinite(parsedSalary)
        ? parsedSalary
        : null;

    setIsSaving(true);
    setUser({
      ...previous,
      dream_company_types: companyTypes,
      dream_work_mode: workMode,
      dream_location: location || null,
      dream_salary: salaryValue,
      dream_industries: industries,
      dream_company_values: companyValues || null,
    });

    const saved = await updateProfile({
      dreamCompanyTypes: companyTypes,
      dreamWorkMode: workMode,
      dreamLocation: location || null,
      dreamSalary: salaryValue,
      dreamIndustries: industries,
      dreamCompanyValues: companyValues || null,
    });

    if (!saved) {
      setUser(previous);
      notify(t("dreamJobSaveError"));
    }
    setIsSaving(false);
    if (saved) router.push(ROUTES.HOME);
  };

  const base = {
    step,
    totalSteps: TOTAL_STEPS,
    primaryLabel: tCommon("nextButton"),
    secondaryLabel:
      step === COMPANY_TYPES_STEP
        ? tCommon("cancelButton")
        : tCommon("backButton"),
    onSecondary:
      step === COMPANY_TYPES_STEP
        ? () => router.push(ROUTES.HOME)
        : () => setStep(step - 1),
    onPrimary: () => setStep(step + 1),
  };

  if (step === COMPANY_TYPES_STEP) {
    return (
      <FormLayout title={tDreamJob("companyTypesLabel")} {...base}>
        <DreamJobCompanyTypesField
          value={companyTypes}
          onChange={setCompanyTypes}
        />
      </FormLayout>
    );
  }

  if (step === WORK_MODE_STEP) {
    return (
      <FormLayout title={tDreamJob("workModeLabel")} {...base}>
        <DreamJobWorkModeField value={workMode} onChange={setWorkMode} />
      </FormLayout>
    );
  }

  if (step === SALARY_STEP) {
    return (
      <FormLayout title={tDreamJob("salaryLabel")} {...base}>
        <DreamJobSalaryField value={salary} onChange={setSalary} />
      </FormLayout>
    );
  }

  const getFormProps = (): FormProps => {
    switch (step) {
      case LOCATION_STEP:
        return {
          ...base,
          type: "location",
          formId: SIGNUP_FORM_ID,
          title: tDreamJob("locationLabel"),
          format: "city-country",
          defaultValue: location,
          onChange: (d) => {
            setLocation(d.location);
            setStep(step + 1);
          },
        };
      case INDUSTRIES_STEP:
        return {
          ...base,
          type: "keys",
          title: tDreamJob("industriesLabel"),
          placeholder: tDreamJob("industriesPlaceholder"),
          defaultValue: industries,
          onChange: setIndustries,
        };
      case COMPANY_VALUES_STEP:
      default:
        return {
          ...base,
          type: "text",
          title: tDreamJob("companyValuesLabel"),
          placeholder: tDreamJob("companyValuesPlaceholder"),
          defaultValue: companyValues,
          onChange: setCompanyValues,
          primaryLabel: t("saveButton"),
          primaryLoading: isSaving,
          onPrimary: save,
        };
    }
  };

  return <Form key={step} {...getFormProps()} />;
};
