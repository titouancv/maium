"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useUserStore, type UserState } from "@/stores/useUserStore";
import { StepName } from "./StepName";
import { ROUTES, API } from "@/constants";
import { StepPseudo } from "./StepPseudo";
import { StepDob } from "./StepDob";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { StepLayout } from "./StepLayout";

interface SignupWizardProps {
  initialStep?: number;
  initialUser?: Partial<UserState>;
}

export const SignupWizard = ({
  initialStep = 1,
  initialUser = {},
}: SignupWizardProps) => {
  const [step, setStep] = useState(initialStep);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("auth.signup");
  const { setUser, user } = useUserStore();

  const nextStep = (data: Partial<UserState>) => {
    setUser(data);
    setError(null);
    setStep((s) => s + 1);
  };

  const finish = async (data: Partial<UserState>) => {
    setUser(data);
    const merged = { ...user, ...data };
    const isOAuth = !!initialUser.supabaseId;

    const res = await fetch(isOAuth ? API.USERS_ME : API.USERS, {
      method: isOAuth ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isOAuth
          ? {
              firstName: merged.firstName,
              lastName: merged.lastName,
              pseudo: merged.pseudo,
              dob: merged.dob,
            }
          : {
              email: merged.email,
              password: merged.password,
              firstName: merged.firstName,
              lastName: merged.lastName,
              pseudo: merged.pseudo,
              dob: merged.dob,
            },
      ),
    });

    if (res.ok) {
      if (!isOAuth) {
        const json = await res.json();
        setUser({ supabaseId: json.id });
      }
      router.push(ROUTES.HOME);
    } else if (res.status === 409) {
      setError(isOAuth ? t("duplicatePseudoError") : t("duplicateEmailError"));
    } else {
      setError(t("signupError"));
    }
  };

  const FORM_ID = "signup-step-form";

  const stepTitles: Record<number, string> = {
    1: t("step1.title"),
    2: t("step2.title"),
    3: t("step3.title"),
    4: t("step4.title"),
  };

  const stepNavProps = {
    2: { formId: FORM_ID, onBack: () => setStep(1), backLabel: t("step2.backButton"), nextLabel: t("step2.nextButton") },
    3: { formId: FORM_ID, onBack: () => setStep(2), backLabel: t("step3.backButton"), nextLabel: t("step3.nextButton") },
    4: { formId: FORM_ID, onBack: () => setStep(3), backLabel: t("step4.backButton"), nextLabel: t("step4.submitButton") },
  }[step];

  return (
    <StepLayout title={stepTitles[step] ?? t("title")} step={step} {...stepNavProps}>
      {step === 1 && (
        <div className="">
          <GoogleSignInButton />
        </div>
      )}
      {step === 2 && (
        <StepName
          onNext={nextStep}
          defaultFirstName={initialUser.firstName}
          defaultLastName={initialUser.lastName}
        />
      )}
      {step === 3 && <StepPseudo onNext={nextStep} />}
      {step === 4 && <StepDob onNext={finish} />}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </StepLayout>
  );
};
