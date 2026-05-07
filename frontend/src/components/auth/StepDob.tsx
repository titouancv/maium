"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { UserState, useUserStore } from "@/stores/useUserStore";

const schema = z.object({
  dob: z.string().min(10), // e.g., YYYY-MM-DD
});

export const StepDob = ({
  onNext,
  onBack,
}: {
  onNext: (d: Partial<UserState>) => void;
  onBack: () => void;
}) => {
  const t = useTranslations("auth.signup.step4");
  const { user, setUser } = useUserStore();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      dob: user?.dob || "",
    },
  });

  const handleBack = () => {
    setUser(getValues());
    onBack();
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <TextInput
        type="date"
        placeholder={t("dobPlaceholder")}
        error={errors.dob?.message as string}
        {...register("dob")}
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
          {t("submitButton")}
        </Button>
      </div>
    </form>
  );
};
