"use client";

import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useUserStore, type UserState } from "@/stores/useUserStore";
import { ROUTES, API, SIGNUP_FORM_ID } from "@/constants";
import { StepLayout } from "../layout/StepLayout";
import { GoogleSignInButton } from "../ui/custom/signup/GoogleSignInButton";
import { StepName } from "../ui/custom/signup/StepName";
import { StepPseudo } from "../ui/custom/signup/StepPseudo";
import { StepDob } from "../ui/custom/signup/StepDob";
import {
  StepExperience,
  type ExperienceStepHandle,
  type ExperienceStepMode,
} from "../ui/custom/signup/StepExperience";
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
  const step4Ref = useRef<ExperienceStepHandle>(null);
  const [step4Mode, setStep4Mode] = useState<ExperienceStepMode>("empty");
  const step5Ref = useRef<ExperienceStepHandle>(null);
  const [step5Mode, setStep5Mode] = useState<ExperienceStepMode>("empty");
  const router = useRouter();
  const t = useTranslations("auth.signup");
  const tCommon = useTranslations("common");
  const { setUser, user } = useUserStore();
  const isCentered =
    (step === 4 && step4Mode === "empty") ||
    (step === 5 && step5Mode === "empty");

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
    setError(null);

    if (initialUser.supabaseId) {
      const res = await patchProfile(data);
      if (!res.ok) {
        setError(
          res.status === 409 ? t("duplicatePseudoError") : t("signupError"),
        );
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

    const oauthBody = {
      firstName: merged.firstName,
      lastName: merged.lastName,
      pseudo: merged.pseudo,
      dob: merged.dob,
      professionalExperiences: merged.professionalExperiences ?? [],
      educationalExperiences: merged.educationalExperiences ?? [],
    };
    const createBody = {
      email: merged.email,
      password: merged.password,
      firstName: merged.firstName,
      lastName: merged.lastName,
      pseudo: merged.pseudo,
      dob: merged.dob,
    };

    let res: Response;
    if (isOAuth) {
      res = await patchProfile(oauthBody);
    } else {
      setIsLoading(true);
      res = await fetch(API.USERS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createBody),
      });
      setIsLoading(false);
    }

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
          formId: SIGNUP_FORM_ID,
          primaryLabel: tCommon("nextButton"),
          secondaryLabel: tCommon("addButton"),
          onSecondary: () => {
            step4Ref.current?.addEntry();
          },
        }
      : { formId: SIGNUP_FORM_ID, primaryLabel: tCommon("nextButton") };

  const stepNavProps = {
    1: { formId: SIGNUP_FORM_ID, primaryLabel: tCommon("nextButton") },
    2: { formId: SIGNUP_FORM_ID, primaryLabel: tCommon("nextButton") },
    3: { formId: SIGNUP_FORM_ID, primaryLabel: tCommon("nextButton") },
    4: step4NavProps,
    5:
      step5Mode === "list"
        ? {
            formId: SIGNUP_FORM_ID,
            primaryLabel: tCommon("nextButton"),
            secondaryLabel: tCommon("addButton"),
            onSecondary: () => {
              step5Ref.current?.addEntry();
            },
          }
        : { formId: SIGNUP_FORM_ID, primaryLabel: tCommon("nextButton") },
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
          primaryDisabled={step < 4 && !isStepValid}
          primaryLoading={isLoading}
          centerContent={isCentered ? true : undefined}
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
            <StepDob
              onNext={nextStep}
              onValidityChange={setIsStepValid}
              defaultDob={initialUser.dob}
            />
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
          {error && <p className="text-error text-sm">{error}</p>}
        </StepLayout>
      )}
    </>
  );
};
