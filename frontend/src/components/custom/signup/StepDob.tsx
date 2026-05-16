"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { DateInput } from "@/components/ui/DateInput";
import { UserState, useUserStore } from "@/stores/useUserStore";

export const StepDob = ({
  onNext,
  onValidityChange,
  defaultDob,
}: {
  onNext: (d: Partial<UserState>) => void;
  onValidityChange?: (isValid: boolean) => void;
  defaultDob?: string;
}) => {
  const t = useTranslations("auth.signup.step4");
  const { user } = useUserStore();

  const schema = z.object({
    dob: z
      .string()
      .min(10, t("dobInvalid"))
      .refine((val) => !isNaN(new Date(val).getTime()), {
        message: t("dobInvalid"),
      })
      .refine((val) => new Date(val) < new Date(), { message: t("dobFuture") }),
  });

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors, isValid, isSubmitted },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      dob: user?.dob || defaultDob || "",
    },
  });

  useEffect(() => {
    trigger();
  }, [trigger]);

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  return (
    <form
      id="signup-step-form"
      onSubmit={handleSubmit(onNext)}
      className="space-y-4"
    >
      <Controller
        name="dob"
        control={control}
        render={({ field }) => (
          <DateInput
            {...field}
            autoFocus
            autoComplete="bday"
            error={field.value?.length === 10 ? (errors.dob?.message as string) : undefined}
          />
        )}
      />
    </form>
  );
};
