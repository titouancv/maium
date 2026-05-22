"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useUserStore, type UserState } from "@/stores/useUserStore";
import { ROUTES, API, SIGNUP_FORM_ID, EXPERIENCE_NAMESPACE } from "@/constants";
import { Form } from "../form/Form";
import type { FormProps } from "../form/Form";
import { Title } from "../ui";
import type { Experience } from "@/types/experience";
import { GoogleSignInButton } from "../custom";

interface SignupWizardProps {
  initialStep?: number;
  initialUser?: Partial<UserState>;
}

const TOTAL_STEPS = 5;

export const SignupWizard = ({
  initialStep = 0,
  initialUser = {},
}: SignupWizardProps) => {
  const searchParams = useSearchParams();
  const urlStep = searchParams.get("step");
  const [step, setStep] = useState(
    urlStep ? parseInt(urlStep, 10) : initialStep,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [proExperiences, setProExperiences] = useState<Experience[]>(
    () => initialUser.professionalExperiences ?? [],
  );
  const [eduExperiences, setEduExperiences] = useState<Experience[]>(
    () => initialUser.educationalExperiences ?? [],
  );
  const router = useRouter();
  const tCommon = useTranslations("common");
  const { setUser, user } = useUserStore();

  useEffect(() => {
    if (!user && Object.keys(initialUser).length > 0) {
      setUser(initialUser);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patchProfile = async (body: unknown) => {
    setIsLoading(true);
    const res = await fetch(API.USERS_ME, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setIsLoading(false);
    return res;
  };

  const nextStep = async (data: Partial<UserState>) => {
    const res = await patchProfile(data);
    if (!res.ok) return;
    setUser(data);
    setStep(step + 1);
  };

  const finish = async (data: Partial<UserState>) => {
    setUser(data);
    const merged = { ...user, ...data };

    const res = await patchProfile({
      firstName: merged.firstName,
      lastName: merged.lastName,
      pseudo: merged.pseudo,
      dob: merged.dob,
      professionalExperiences: merged.professionalExperiences ?? [],
      educationalExperiences: merged.educationalExperiences ?? [],
    });

    if (res.ok) {
      router.push(ROUTES.HOME);
    }
  };

  const base = {
    step,
    totalSteps: TOTAL_STEPS,
    primaryLabel: tCommon("nextButton"),
    primaryLoading: isLoading,
  };

  const getFormProps = (): FormProps => {
    switch (step) {
      case 1:
        return {
          ...base,
          type: "fullName",
          formId: SIGNUP_FORM_ID,
          defaultValue: {
            firstName: initialUser.firstName,
            lastName: initialUser.lastName,
          },
          onChange: nextStep,
        };
      case 2:
        return {
          ...base,
          type: "pseudo",
          formId: SIGNUP_FORM_ID,
          defaultValue: initialUser.pseudo,
          onChange: nextStep,
        };
      case 3:
        return {
          ...base,
          type: "date",
          formId: SIGNUP_FORM_ID,
          defaultValue: initialUser.dob,
          onChange: nextStep,
        };
      case 4:
        return {
          ...base,
          type: "experiences",
          namespace: EXPERIENCE_NAMESPACE.professional,
          defaultValue: proExperiences,
          onChange: setProExperiences,
          onPrimary: () =>
            nextStep({ professionalExperiences: proExperiences }),
        };
      default:
        return {
          ...base,
          type: "experiences",
          namespace: EXPERIENCE_NAMESPACE.educational,
          defaultValue: eduExperiences,
          onChange: setEduExperiences,
          onPrimary: () => finish({ educationalExperiences: eduExperiences }),
        };
    }
  };

  return (
    <>
      {step === 0 ? (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8">
          <Title label={"maium"} size="h1" />
          <GoogleSignInButton />
        </div>
      ) : (
        <Form {...getFormProps()} />
      )}
    </>
  );
};
