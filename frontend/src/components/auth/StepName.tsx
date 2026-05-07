"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { UserState, useUserStore } from "@/stores/useUserStore";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const StepName = ({
  onNext,
  onBack,
}: {
  onNext: (d: Partial<UserState>) => void;
  onBack: () => void;
}) => {
  const t = useTranslations("auth.signup.step2");
  const { user, setUser } = useUserStore();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    },
  });

  const handleBack = () => {
    setUser(getValues());
    onBack();
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <TextInput
        placeholder={t("firstNamePlaceholder")}
        error={errors.firstName?.message as string}
        {...register("firstName")}
      />
      <TextInput
        placeholder={t("lastNamePlaceholder")}
        error={errors.lastName?.message as string}
        {...register("lastName")}
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
