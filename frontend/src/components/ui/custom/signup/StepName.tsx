"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { TextInput } from "@/components/ui/TextInput";
import { UserState, useUserStore } from "@/stores/useUserStore";
import { SIGNUP_FORM_ID } from "@/constants";

export const StepName = ({
  onNext,
  defaultFirstName,
  defaultLastName,
}: {
  onNext: (d: Partial<UserState>) => void;
  defaultFirstName?: string;
  defaultLastName?: string;
}) => {
  const t = useTranslations("auth.signup.step2");
  const { user } = useUserStore();
  const schema = z.object({
    firstName: z.string().min(1, t("firstNameRequired")),
    lastName: z.string().min(1, t("lastNameRequired")),
  });
  const {
    register,
    handleSubmit,
    trigger,
    setFocus,
    formState: { errors, isValid, touchedFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      firstName: user?.firstName || defaultFirstName || "",
      lastName: user?.lastName || defaultLastName || "",
    },
  });

  useEffect(() => {
    trigger();
    setFocus("firstName");
  }, []);

  return (
    <form
      id={SIGNUP_FORM_ID}
      onSubmit={handleSubmit(onNext)}
      className="space-y-4"
    >
      <TextInput
        placeholder={t("firstNamePlaceholder")}
        infoLabel={
          touchedFields.firstName
            ? (errors.firstName?.message as string)
            : undefined
        }
        infoType={
          touchedFields.firstName && errors.firstName ? "error" : "info"
        }
        inputMode="text"
        autoCapitalize="words"
        autoComplete="given-name"
        enterKeyHint="next"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setFocus("lastName");
          }
        }}
        {...register("firstName")}
      />
      <TextInput
        placeholder={t("lastNamePlaceholder")}
        infoLabel={
          touchedFields.lastName
            ? (errors.lastName?.message as string)
            : undefined
        }
        infoType={touchedFields.lastName && errors.lastName ? "error" : "info"}
        inputMode="text"
        autoCapitalize="words"
        autoComplete="family-name"
        enterKeyHint="done"
        {...register("lastName")}
      />
    </form>
  );
};
