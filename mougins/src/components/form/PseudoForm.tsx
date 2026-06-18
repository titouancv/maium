"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { TextInput } from "@/components/ui/TextInput";
import { sanitizePseudo } from "@/lib/utils";
import {
  API,
  PSEUDO_MIN_LENGTH,
  PSEUDO_REGEX,
  SIGNUP_FORM_ID,
  type InfoType,
} from "@/constants";

type AvailabilityStatus = "idle" | "checking" | "available" | "taken";

interface PseudoFormProps {
  onChange: (d: { pseudo: string }) => void;
  defaultValue?: string;
}

export const PseudoForm = ({ onChange, defaultValue }: PseudoFormProps) => {
  const t = useTranslations("auth.signup.step3");
  const schema = z.object({
    pseudo: z
      .string()
      .min(PSEUDO_MIN_LENGTH, t("pseudoMinLength"))
      .regex(PSEUDO_REGEX, t("pseudoFormat")),
  });
  const {
    register,
    handleSubmit,
    trigger,
    setFocus,
    setError,
    clearErrors,
    control,
    formState: { errors, touchedFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      pseudo: defaultValue || "",
    },
  });

  const [availabilityStatus, setAvailabilityStatus] =
    useState<AvailabilityStatus>("idle");

  const pseudo = useWatch({ control, name: "pseudo" });

  const pseudoField = register("pseudo");

  useEffect(() => {
    trigger();
    setFocus("pseudo");
  }, [trigger, setFocus]);

  useEffect(() => {
    if (!pseudo || pseudo.length < PSEUDO_MIN_LENGTH) {
      const timer = setTimeout(() => setAvailabilityStatus("idle"), 0);
      return () => clearTimeout(timer);
    }

    if (pseudo === defaultValue) {
      const timer = setTimeout(() => {
        setAvailabilityStatus("available");
        clearErrors("pseudo");
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(async () => {
      setAvailabilityStatus("checking");
      try {
        const res = await fetch(
          `${API.USERS_PSEUDO_CHECK}?value=${encodeURIComponent(pseudo)}`,
        );
        const data = await res.json();
        if (data.available) {
          setAvailabilityStatus("available");
          clearErrors("pseudo");
        } else {
          setAvailabilityStatus("taken");
          setError("pseudo", { message: t("pseudoTaken") });
        }
      } catch {
        setAvailabilityStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [pseudo, defaultValue, clearErrors, setError, t]);

  const getInfoLabel = () => {
    if (touchedFields.pseudo && errors.pseudo?.message)
      return errors.pseudo.message;
    if (availabilityStatus === "checking") return t("pseudoChecking");
    if (availabilityStatus === "available") return t("pseudoAvailable");
    return undefined;
  };

  const getInfoType = (): InfoType => {
    if (touchedFields.pseudo && errors.pseudo) return "error";
    if (availabilityStatus === "checking") return "info";
    if (availabilityStatus === "available") return "success";
    return "info";
  };

  return (
    <div className="md:flex md:flex-1 md:flex-col md:justify-center">
      <form
        id={SIGNUP_FORM_ID}
        onSubmit={handleSubmit(onChange)}
        className="space-y-4"
      >
        <TextInput
          placeholder={t("pseudoPlaceholder")}
          infoLabel={getInfoLabel()}
          infoType={getInfoType()}
          inputMode="text"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="username"
          enterKeyHint="done"
          {...pseudoField}
          onChange={(e) => {
            e.target.value = sanitizePseudo(e.target.value);
            pseudoField.onChange(e);
          }}
        />
      </form>
    </div>
  );
};
