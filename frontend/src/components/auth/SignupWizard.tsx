"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useUserStore, type UserState } from "@/stores/useUserStore";
import { StepEmailPassword } from "./StepEmailPassword";
import { StepName } from "./StepName";
import { ROUTES } from "@/constants/routes";
import { StepPseudo } from "./StepPseudo";
import { StepDob } from "./StepDob";

export const SignupWizard = () => {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { setUser } = useUserStore();

  const nextStep = (data: Partial<UserState>) => {
    setUser(data);
    setStep((s) => s + 1);
  };

  const finish = (data: Partial<UserState>) => {
    setUser(data);
    router.push(ROUTES.HOME);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`size-2 rounded-full ${
              step >= s ? "bg-primary" : "bg-surface-400"
            }`}
          />
        ))}
      </div>

      {step === 1 && <StepEmailPassword onNext={nextStep} />}
      {step === 2 && <StepName onNext={nextStep} onBack={() => setStep(1)} />}
      {step === 3 && <StepPseudo onNext={nextStep} onBack={() => setStep(2)} />}
      {step === 4 && <StepDob onNext={finish} onBack={() => setStep(3)} />}
    </div>
  );
};
