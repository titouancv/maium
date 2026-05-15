"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useUserStore, type UserState } from "@/stores/useUserStore";
import { ROUTES, API } from "@/constants";
import { StepLayout } from "../layout/StepLayout";
import { GoogleSignInButton } from "../auth/GoogleSignInButton";
import { StepName } from "../auth/StepName";
import { StepPseudo } from "../auth/StepPseudo";
import { StepDob } from "../auth/StepDob";
import { Title } from "../ui";

interface SignupWizardProps {
  initialStep?: number;
  initialUser?: Partial<UserState>;
}

export const SignupWizard = ({
  initialStep = 0,
  initialUser = {},
}: SignupWizardProps) => {
  const [step, setStep] = useState(initialStep);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("auth.signup");
  const { setUser, user } = useUserStore();

  const nextStep = async (data: Partial<UserState>) => {
    setError(null);

    if (initialUser.supabaseId) {
      const res = await fetch(API.USERS_ME, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        if (res.status === 409) {
          setError(t("duplicatePseudoError"));
        } else {
          setError(t("signupError"));
        }
        return;
      }
    }

    setUser(data);
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
      router.push(ROUTES.WELCOME);
    } else if (res.status === 409) {
      setError(isOAuth ? t("duplicatePseudoError") : t("duplicateEmailError"));
    } else {
      setError(t("signupError"));
    }
  };

  const FORM_ID = "signup-step-form";

  const stepTitles: Record<number, string> = {
    1: t("step2.title"),
    2: t("step3.title"),
    3: t("step4.title"),
  };

  const stepNavProps = {
    1: {
      formId: FORM_ID,
      onBack: () => setStep(0),
      backLabel: t("step2.backButton"),
      nextLabel: t("step2.nextButton"),
    },
    2: {
      formId: FORM_ID,
      onBack: () => setStep(1),
      backLabel: t("step3.backButton"),
      nextLabel: t("step3.nextButton"),
    },
    3: {
      formId: FORM_ID,
      onBack: () => setStep(2),
      backLabel: t("step4.backButton"),
      nextLabel: t("step4.submitButton"),
    },
  }[step];

  return (
    <>
      {step === 0 ? (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8">
          <Title label={"maium"} size="h1" />
          <GoogleSignInButton />
        </div>
      ) : (
        <StepLayout
          title={stepTitles[step] ?? t("title")}
          step={step}
          totalSteps={3}
          {...stepNavProps}
        >
          {step === 1 && (
            <StepName
              onNext={nextStep}
              defaultFirstName={initialUser.firstName}
              defaultLastName={initialUser.lastName}
            />
          )}
          {step === 2 && (
            <StepPseudo onNext={nextStep} defaultPseudo={initialUser.pseudo} />
          )}
          {step === 3 && <StepDob onNext={finish} />}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </StepLayout>
      )}
    </>
  );
};
