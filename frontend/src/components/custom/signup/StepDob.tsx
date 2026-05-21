"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { DateInput } from "@/components/ui/DateInput";
import { UserState, useUserStore } from "@/stores/useUserStore";
import { SIGNUP_FORM_ID } from "@/constants";

export const StepDob = ({
  onNext,
  defaultDob,
}: {
  onNext: (d: Partial<UserState>) => void;
  defaultDob?: number | null;
}) => {
  const t = useTranslations("auth.signup.step4");
  const { user } = useUserStore();

  const schema = z.object({
    dob: z
      .number()
      .nullable()
      .refine((v) => v !== null, { message: t("dobInvalid") })
      .refine((v) => v === null || v < Date.now(), { message: t("dobFuture") }),
  });

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      dob: (user?.dob ?? defaultDob ?? null) as number | null,
    },
  });

  useEffect(() => {
    trigger();
  }, [trigger]);

  const onSubmit = handleSubmit((data) => onNext({ dob: data.dob as number }));

  return (
    <form
      id={SIGNUP_FORM_ID}
      onSubmit={onSubmit}
      className="space-y-4"
    >
      <Controller
        name="dob"
        control={control}
        render={({ field }) => (
          <DateInput
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            autoFocus
            autoComplete="bday"
            error={
              field.value !== null
                ? (errors.dob?.message as string)
                : undefined
            }
            onComplete={onSubmit}
          />
        )}
      />
    </form>
  );
};
