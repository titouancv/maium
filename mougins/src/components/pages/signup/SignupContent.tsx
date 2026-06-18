"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ROUTES, API, SIGNUP_FORM_ID, GENDERS, type Gender } from "@/constants";
import { Form } from "../../form/Form";
import type { FormProps } from "../../form/Form";
import { SIGNUP_TOTAL_STEPS, type SignupDraft } from "./steps";
import { HeroSection } from "../home/collections";
import { PageLayout } from "@/components/layout/PageLayout";

interface SignupContentProps {
  initialStep?: number;
  initialDraft?: SignupDraft;
}

const EMPTY_DRAFT: SignupDraft = {};

export const SignupContent = ({
  initialStep = 0,
  initialDraft = EMPTY_DRAFT,
}: SignupContentProps) => {
  const searchParams = useSearchParams();
  const urlStep = searchParams.get("step");
  const [step, setStep] = useState(
    urlStep ? parseInt(urlStep, 10) : initialStep,
  );
  const [draft, setDraft] = useState<SignupDraft>(initialDraft);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const tSignup = useTranslations("auth.signup");
  const tForm = useTranslations("form");
  const tGender = useTranslations("gender");

  // Persist a slice of the draft to the user row. Each wizard step saves
  // incrementally so a refresh/resume never loses progress.
  const patchProfile = async (body: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(API.USERS_ME, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) setError(tSignup("saveError"));
      return res.ok;
    } catch {
      setError(tSignup("saveError"));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async (data: Partial<SignupDraft>) => {
    const ok = await patchProfile(data as Record<string, unknown>);
    if (!ok) return;
    setDraft((d) => ({ ...d, ...data }));
    setStep((s) => s + 1);
  };

  // Last step: persist the final slice, mark onboarding complete, and hand off
  // to the home page which shows the welcome celebration (?welcome=1).
  const finish = async () => {
    const ok = await patchProfile({
      gender: draft.gender ?? GENDERS[0],
      onboardingCompleted: true,
    });
    if (ok) router.push(`${ROUTES.HOME}?welcome=1`);
  };

  const base = {
    step,
    totalSteps: SIGNUP_TOTAL_STEPS,
    primaryLabel: tCommon("nextButton"),
    primaryLoading: isLoading,
    error: error ?? undefined,
  };

  const getFormProps = (): FormProps => {
    switch (step) {
      case 1:
        return {
          ...base,
          type: "fullName",
          formId: SIGNUP_FORM_ID,
          defaultValue: {
            firstName: draft.firstName,
            lastName: draft.lastName,
          },
          onChange: nextStep,
        };
      case 2:
        return {
          ...base,
          type: "pseudo",
          formId: SIGNUP_FORM_ID,
          defaultValue: draft.pseudo,
          onChange: nextStep,
        };
      case 3:
        return {
          ...base,
          type: "date",
          formId: SIGNUP_FORM_ID,
          defaultValue: draft.dob ?? null,
          onChange: nextStep,
        };
      default:
        return {
          ...base,
          title: tForm("genderTitle"),
          type: "select",
          options: GENDERS.map((value) => ({
            value,
            label: tGender(value),
          })),
          defaultValue: draft.gender ?? GENDERS[0],
          onChange: (value) =>
            setDraft((d) => ({ ...d, gender: value as Gender })),
          onPrimary: finish,
        };
    }
  };

  if (step === 0) {
    return (
      <PageLayout title={tNav("home")} backLabel={tCommon("backButton")}>
        <HeroSection />
      </PageLayout>
    );
  }

  return <Form {...getFormProps()} />;
};
