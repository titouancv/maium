"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { TextInput } from "@/components/ui/TextInput";
import { UserState, useUserStore } from "@/stores/useUserStore";

const schema = z.object({
  pseudo: z.string().min(3),
});

export const StepPseudo = ({
  onNext,
  defaultPseudo,
}: {
  onNext: (d: Partial<UserState>) => void;
  defaultPseudo?: string;
}) => {
  const t = useTranslations("auth.signup.step3");
  const { user } = useUserStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      pseudo: user?.pseudo || defaultPseudo || "",
    },
  });

  return (
    <form id="signup-step-form" onSubmit={handleSubmit(onNext)} className="space-y-4">
      <TextInput
        placeholder={t("pseudoPlaceholder")}
        error={errors.pseudo?.message as string}
        {...register("pseudo")}
      />
    </form>
  );
};
