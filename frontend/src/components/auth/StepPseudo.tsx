"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { UserState, useUserStore } from "@/stores/useUserStore";

const schema = z.object({
  pseudo: z.string().min(3),
});

export const StepPseudo = ({
  onNext,
  onBack,
}: {
  onNext: (d: Partial<UserState>) => void;
  onBack: () => void;
}) => {
  const t = useTranslations("auth.signup.step3");
  const { user, setUser } = useUserStore();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      pseudo: user?.pseudo || "",
    },
  });

  const handleBack = () => {
    setUser(getValues());
    onBack();
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <TextInput
        placeholder={t("pseudoPlaceholder")}
        error={errors.pseudo?.message as string}
        {...register("pseudo")}
      />
      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          type="button"
          onClick={handleBack}
          className="w-full"
        >
          {t("backButton")}
        </Button>
        <Button type="submit" className="w-full">
          {t("nextButton")}
        </Button>
      </div>
    </form>
  );
};
