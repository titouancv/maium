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
  onChange: (d: { dob: string }) => void;
  defaultValue?: string;
}

export const DateForm = ({ onChange, defaultValue }: DateFormProps) => {
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
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      dob: user?.dob || defaultValue || "",
    },
  });

  useEffect(() => {
    trigger();
  }, [trigger]);

  return (
    <div className="md:flex md:flex-1 md:flex-col md:justify-center">
      <form
        id={SIGNUP_FORM_ID}
        onSubmit={handleSubmit(onChange)}
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
              onComplete={handleSubmit(onChange)}
            />
          )}
        />
      </form>
    </div>
  );
};
