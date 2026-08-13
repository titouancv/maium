"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ROUTES, SIGNUP_FORM_ID, GENDERS, type Gender } from "@/constants";
import { updateProfile } from "@/lib/users/updateProfile";
import type { CvExtraction } from "@/lib/validators/cv";
import { Form } from "../../form/Form";
import type { FormProps } from "../../form/Form";
import { SIGNUP_TOTAL_STEPS, stepIndexOf, type SignupDraft } from "./steps";
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

  const patchProfile = async (body: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);
    const ok = await updateProfile(body);
    if (!ok) setError(tSignup("saveError"));
    setIsLoading(false);
    return ok;
  };

  const nextStep = async (data: Partial<SignupDraft>) => {
    const ok = await patchProfile(data as Record<string, unknown>);
    if (!ok) return;
    setDraft((d) => ({ ...d, ...data }));
    setStep((s) => s + 1);
  };

  const skipStep = () => {
    setError(null);
    setStep((s) => s + 1);
  };

  const finish = async () => {
    const ok = await patchProfile({ onboardingCompleted: true });
    if (ok) router.push(`${ROUTES.HOME}?welcome=1`);
  };

  const base = {
    step,
    totalSteps: SIGNUP_TOTAL_STEPS,
    primaryLabel: tCommon("nextButton"),
    primaryLoading: isLoading,
    error: error ?? undefined,
  };

  const applyCvExtraction = (extraction: CvExtraction) =>
    nextStep(extraction as Partial<SignupDraft>);

  const savePhotoAndFinish = async (profilePhoto: string) => {
    const ok = await patchProfile({ profilePhoto, onboardingCompleted: true });
    if (ok) router.push(`${ROUTES.HOME}?welcome=1`);
  };

  const getFormProps = (): FormProps => {
    switch (step) {
      case stepIndexOf("cv"):
        return {
          ...base,
          type: "cvImport",
          primaryLabel: tCommon("skipButton"),
          onPrimary: skipStep,
          onChange: applyCvExtraction,
        };
      case stepIndexOf("fullName"):
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
      case stepIndexOf("pseudo"):
        return {
          ...base,
          type: "pseudo",
          formId: SIGNUP_FORM_ID,
          defaultValue: draft.pseudo,
          onChange: nextStep,
        };
      case stepIndexOf("date"):
        return {
          ...base,
          type: "date",
          formId: SIGNUP_FORM_ID,
          defaultValue: draft.dob ?? null,
          onChange: nextStep,
        };
      case stepIndexOf("gender"):
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
          onPrimary: () => nextStep({ gender: draft.gender ?? GENDERS[0] }),
        };
      default:
        return {
          ...base,
          type: "profilePhoto",
          primaryLabel: tCommon("skipButton"),
          onPrimary: finish,
          defaultValue: draft.profilePhoto,
          onChange: savePhotoAndFinish,
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
