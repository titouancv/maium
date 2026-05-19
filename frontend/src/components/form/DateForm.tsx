"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { DateInput } from "@/components/ui/DateInput";
import { useUserStore } from "@/stores/useUserStore";
import { SIGNUP_FORM_ID } from "@/constants";

interface DateFormProps {
  onNext: (d: { dob: string }) => void;
  defaultDob?: string;
  onValidityChange?: (isValid: boolean) => void;
}

export const DateForm = ({
  onNext,
  defaultDob,
  onValidityChange,
}: DateFormProps) => {
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
    formState: { errors, isValid },
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
      id={SIGNUP_FORM_ID}
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
            error={
              field.value?.length === 10
                ? (errors.dob?.message as string)
                : undefined
            }
            onComplete={handleSubmit(onNext)}
          />
        )}
      />
    </form>
  );
};
