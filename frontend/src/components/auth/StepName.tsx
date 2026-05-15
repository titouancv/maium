"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { TextInput } from "@/components/ui/TextInput";
import { UserState, useUserStore } from "@/stores/useUserStore";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const StepName = ({
  onNext,
  defaultFirstName,
  defaultLastName,
}: {
  onNext: (d: Partial<UserState>) => void;
  defaultFirstName?: string;
  defaultLastName?: string;
}) => {
  const t = useTranslations("auth.signup.step2");
  const { user } = useUserStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName || defaultFirstName || "",
      lastName: user?.lastName || defaultLastName || "",
    },
  });

  return (
    <form id="signup-step-form" onSubmit={handleSubmit(onNext)} className="space-y-4">
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
    </form>
  );
};
