"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { SIGNUP_FORM_ID } from "@/constants";

interface PhoneNumberFormProps {
  onNext: (d: { phone: string }) => void;
  defaultValue?: string;
  onValidityChange?: (isValid: boolean) => void;
}

export const PhoneNumberForm = ({
  onNext,
  defaultValue,
  onValidityChange,
}: PhoneNumberFormProps) => {
  const schema = z.object({
    phone: z.string().min(1),
  });

  const {
    control,
    handleSubmit,
    trigger,
    formState: { isValid },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      phone: defaultPhone ?? "",
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
        name="phone"
        control={control}
        render={({ field }) => (
          <PhoneInput
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            autoFocus
          />
        )}
      />
    </form>
  );
};
