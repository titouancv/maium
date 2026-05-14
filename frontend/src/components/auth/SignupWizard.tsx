"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useUserStore, type UserState } from "@/stores/useUserStore";
import { StepEmailPassword } from "./StepEmailPassword";
import { StepName } from "./StepName";
import { ROUTES, API } from "@/constants";
import { StepPseudo } from "./StepPseudo";
import { StepDob } from "./StepDob";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { AppleSignInButton } from "./AppleSignInButton";

interface SignupWizardProps {
  initialStep?: number;
  initialUser?: Partial<UserState>;
}

export const SignupWizard = ({ initialStep = 1, initialUser = {} }: SignupWizardProps) => {
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`size-2 rounded-full ${
              step >= s ? "bg-main-gradient" : "bg-surface-600"
            }`}
          />
        ))}
      </div>
      {step === 1 && (
        <>
          <div className="flex flex-col gap-3">
            <GoogleSignInButton />
            {/* <AppleSignInButton /> */}
          </div>
          {/* <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-brd-200" />
            <span className="text-sm text-txt-muted">{t("oauth.orDivider")}</span>
            <div className="h-px flex-1 bg-brd-200" />
          </div>
          <StepEmailPassword onNext={nextStep} /> */}
        </>
      )}
      {step === 2 && (
        <StepName
          onNext={nextStep}
          onBack={() => setStep(1)}
          defaultFirstName={initialUser.firstName}
          defaultLastName={initialUser.lastName}
        />
      )}
      {step === 3 && <StepPseudo onNext={nextStep} onBack={() => setStep(2)} />}
      {step === 4 && <StepDob onNext={finish} onBack={() => setStep(3)} />}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
