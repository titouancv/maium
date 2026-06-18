"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { SIGNUP_FORM_ID } from "@/constants";

interface PhoneNumberFormProps {
  onChange: (d: { phone: string }) => void;
  defaultValue?: string;
}

export const PhoneNumberForm = ({
  onChange,
  defaultValue,
}: PhoneNumberFormProps) => {
  const schema = z.object({
    phone: z.string().min(1),
  });

  const { control, handleSubmit, trigger } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      phone: defaultValue ?? "",
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
    </div>
  );
};
