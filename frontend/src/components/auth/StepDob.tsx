"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { TextInput } from "@/components/ui/TextInput";
import { UserState, useUserStore } from "@/stores/useUserStore";

const schema = z.object({
  dob: z.string().min(10), // e.g., YYYY-MM-DD
});

export const StepDob = ({
  onNext,
}: {
  onNext: (d: Partial<UserState>) => void;
}) => {
  const t = useTranslations("auth.signup.step4");
  const { user } = useUserStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      dob: user?.dob || "",
    },
  });

  return (
    <form id="signup-step-form" onSubmit={handleSubmit(onNext)} className="space-y-4">
      <TextInput
        type="date"
        placeholder={t("dobPlaceholder")}
        error={errors.dob?.message as string}
        {...register("dob")}
      />
    </form>
  );
};
