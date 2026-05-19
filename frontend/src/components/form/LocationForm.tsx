"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { LocationInput } from "@/components/ui";
import { SIGNUP_FORM_ID } from "@/constants";

interface LocationFormProps {
  onNext: (d: { location: string }) => void;
  defaultValue?: string;
  onValidityChange?: (isValid: boolean) => void;
}

export const LocationForm = ({
  onNext,
  defaultValue,
  onValidityChange,
}: LocationFormProps) => {
  const t = useTranslations("settings");

  const schema = z.object({
    location: z.string().min(1),
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
      location: defaultValue ?? "",
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
        name="location"
        control={control}
        render={({ field }) => (
          <LocationInput
            placeholder={t("locationPlaceholder")}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.location?.message as string}
            autoFocus
          />
        )}
      />
    </form>
  );
};
