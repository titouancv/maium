"use client";

import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useUserStore, type UserState } from "@/stores/useUserStore";
import { ROUTES, API } from "@/constants";
import { StepLayout } from "../layout/StepLayout";
import { GoogleSignInButton } from "../custom/signup/GoogleSignInButton";
import { StepName } from "../custom/signup/StepName";
import { StepPseudo } from "../custom/signup/StepPseudo";
import { StepDob } from "../custom/signup/StepDob";
import {
  StepExperience,
  type Step4Handle,
  type Step4Mode,
} from "../custom/signup/StepExperience";
import { Title } from "../ui";

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
  const [error, setError] = useState<string | null>(null);
  const [isStepValid, setIsStepValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const step4Ref = useRef<Step4Handle>(null);
  const [step4Mode, setStep4Mode] = useState<Step4Mode>("empty");
  const step5Ref = useRef<Step4Handle>(null);
  const [step5Mode, setStep5Mode] = useState<Step4Mode>("empty");
  const router = useRouter();
  const t = useTranslations("auth.signup");
  const { setUser, user } = useUserStore();

  useEffect(() => {
    if (!user && Object.keys(initialUser).length > 0) {
      setUser(initialUser);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStepChange = (newStep: number) => {
    setIsStepValid(false);
    setStep(newStep);
  };

  const nextStep = async (data: Partial<UserState>) => {
    setError(null);

    if (initialUser.supabaseId) {
      setIsLoading(true);
      const res = await fetch(API.USERS_ME, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setIsLoading(false);
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
    handleStepChange(step + 1);
  };

  const finish = async (data: Partial<UserState>) => {
    setUser(data);
    const merged = { ...user, ...data };
    const isOAuth = !!initialUser.supabaseId;

    setIsLoading(true);
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
              professionalExperiences: merged.professionalExperiences ?? [],
              educationalExperiences: merged.educationalExperiences ?? [],
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
    setIsLoading(false);

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
    4: t("step5.title"),
    5: t("step6.title"),
  };

  const step4NavProps =
    step4Mode === "list"
      ? {
          formId: FORM_ID,
          primaryLabel: t("step5.nextButton"),
          secondaryLabel: t("step5.addEntry"),
          onSecondary: () => {
            step4Ref.current?.addEntry();
          },
        }
      : { formId: FORM_ID, primaryLabel: t("step5.nextButton") };

  const stepNavProps = {
    1: { formId: FORM_ID, primaryLabel: t("step2.nextButton") },
    2: { formId: FORM_ID, primaryLabel: t("step3.nextButton") },
    3: { formId: FORM_ID, primaryLabel: t("step4.nextButton") },
    4: step4NavProps,
    5: step5Mode === "list"
      ? {
          formId: FORM_ID,
          primaryLabel: t("step6.nextButton"),
          secondaryLabel: t("step6.addEntry"),
          onSecondary: () => { step5Ref.current?.addEntry(); },
        }
      : { formId: FORM_ID, primaryLabel: t("step6.nextButton") },
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
          totalSteps={TOTAL_STEPS}
          primaryDisabled={!isStepValid}
          primaryLoading={isLoading}
          {...stepNavProps}
        >
          {step === 1 && (
            <StepName
              onNext={nextStep}
              defaultFirstName={initialUser.firstName}
              defaultLastName={initialUser.lastName}
              onValidityChange={setIsStepValid}
            />
          )}
          {step === 2 && (
            <StepPseudo
              onNext={nextStep}
              defaultPseudo={initialUser.pseudo}
              onValidityChange={setIsStepValid}
            />
          )}
          {step === 3 && (
            <StepDob onNext={nextStep} onValidityChange={setIsStepValid} />
          )}
          {step === 4 && (
            <StepExperience
              type="professional"
              ref={step4Ref}
              onNext={nextStep}
              onValidityChange={setIsStepValid}
              onModeChange={setStep4Mode}
            />
          )}
          {step === 5 && (
            <StepExperience
              type="educational"
              ref={step5Ref}
              onNext={finish}
              onValidityChange={setIsStepValid}
              onModeChange={setStep5Mode}
            />
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </StepLayout>
      )}
    </>
  );
};
