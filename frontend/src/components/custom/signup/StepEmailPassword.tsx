"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { TextInput } from "@/components/ui/TextInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { useUserStore, type UserState } from "@/stores/useUserStore";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const StepEmailPassword = ({
  onNext,
}: {
  onNext: (d: Partial<UserState>) => void;
}) => {
  const t = useTranslations("auth.signup.step1");
  const { user } = useUserStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: user?.email || "",
      password: user?.password || "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <TextInput
        placeholder={t("emailPlaceholder")}
        infoLabel={errors.email?.message as string}
        infoType="error"
        {...register("email")}
      />
      <PasswordInput
        placeholder={t("passwordPlaceholder")}
        infoLabel={errors.password?.message as string}
        infoType="error"
        {...register("password")}
      />
      <Button type="submit" className="mt-4 w-full" size="lg">
        {t("nextButton")}
      </Button>
    </form>
  );
};
