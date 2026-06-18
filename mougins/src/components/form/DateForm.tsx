"use client";

import { useEffect, useMemo } from "react";

import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { DateInput } from "@/components/ui/DateInput";
import { SIGNUP_FORM_ID, MIN_SIGNUP_AGE } from "@/constants";
import { isAtLeastYearsOld } from "@/lib/date";

const isPastDate = (v: number | null): boolean => v === null || v < Date.now();
const isOldEnough = (v: number | null): boolean =>
  v === null || isAtLeastYearsOld(v, MIN_SIGNUP_AGE);
interface DateFormProps {
  onChange: (d: { dob: number }) => void;
  defaultValue?: number | null;
}

export const DateForm = ({ onChange, defaultValue }: DateFormProps) => {
  const t = useTranslations("auth.signup.step4");

  const schema = useMemo(
    () =>
      z.object({
        dob: z
          .number()
          .nullable()
          .refine((v) => v !== null, { message: t("dobInvalid") })
          .refine(isPastDate, { message: t("dobFuture") })
          .refine(isOldEnough, {
            message: t("dobTooYoung", { minAge: MIN_SIGNUP_AGE }),
          }),
      }),
    [t],
  );

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      dob: (defaultValue ?? null) as number | null,
    },
  });

  useEffect(() => {
    trigger();
  }, [trigger]);

  const onSubmit = handleSubmit((data) =>
    onChange({ dob: data.dob as number }),
  );

  return (
    <div className="md:flex md:flex-1 md:flex-col md:justify-center">
      <form id={SIGNUP_FORM_ID} onSubmit={onSubmit} className="space-y-4">
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
    </div>
  );
};
