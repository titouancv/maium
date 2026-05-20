"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { TextInput } from "@/components/ui/TextInput";
import { TextArea } from "@/components/ui/TextArea";
import { DateInput } from "@/components/ui/DateInput";
import { LocationInput } from "@/components/ui";
import { FormLayout } from "@/components/layout/FormLayout";
import { makeExperienceFormSchema } from "@/lib/validators/user";
import type { ExperienceFormData } from "@/types/experience";

interface Props {
  namespace: string;
  dateMode: "MM-YYYY" | "YYYY";
  initialData?: Partial<ExperienceFormData>;
  onSave: (data: ExperienceFormData) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export const ExperienceSubWizard = ({
  namespace,
  dateMode,
  initialData,
  onSave,
  onCancel,
  onDelete,
}: Props) => {
  const t = useTranslations(namespace);
  const tCommon = useTranslations("common");
  const [subStep, setSubStep] = useState(1);
  const endPeriodRef = useRef<HTMLInputElement>(null);
  const TOTAL = 6;

  const schema = makeExperienceFormSchema(t);

  const {
    register,
    control,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<ExperienceFormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      organization: initialData?.organization ?? "",
      role: initialData?.role ?? "",
      startPeriod: initialData?.startPeriod ?? "",
      endPeriod: initialData?.endPeriod ?? "",
      description: initialData?.description ?? "",
      website: initialData?.website ?? "",
      location: initialData?.location ?? "",
    },
  });

  const stepFields: Record<number, (keyof ExperienceFormData)[]> = {
    1: ["organization"],
    2: ["role"],
    3: ["startPeriod", "endPeriod"],
    4: ["description"],
    5: ["website"],
    6: ["location"],
  };

  const handlePrimary = async () => {
    const valid = await trigger(stepFields[subStep]);
    if (!valid) return;
    if (subStep < TOTAL) {
      setSubStep((s) => s + 1);
    } else {
      handleSubmit(onSave)();
    }
  };

  const titles = [
    t("subStep1Title"),
    t("subStep2Title"),
    t("subStep3Title"),
    t("subStep4Title"),
    t("subStep5Title"),
    t("subStep6Title"),
  ];

  return (
    <FormLayout
      title={titles[subStep - 1]}
      step={subStep}
      totalSteps={TOTAL}
      isCancelable={true}
      onCancel={onCancel}
      cancelLabel={tCommon("cancelButton")}
      primaryLabel={subStep < TOTAL ? tCommon("nextButton") : t("saveButton")}
      onPrimary={handlePrimary}
      secondaryLabel={t("removeEntry")}
      onSecondary={onDelete}
    >
      <div className={cn("flex flex-col gap-3", subStep !== 6 && "md:flex-1 md:justify-center")}>
        {subStep === 1 && (
          <TextInput
            placeholder={t("organizationPlaceholder")}
            infoLabel={errors.organization?.message}
            infoType={errors.organization ? "error" : "info"}
            autoCapitalize="words"
            enterKeyHint="next"
            autoFocus
            {...register("organization")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handlePrimary();
              }
            }}
          />
        )}

        {subStep === 2 && (
          <TextInput
            placeholder={t("rolePlaceholder")}
            infoLabel={errors.role?.message}
            infoType={errors.role ? "error" : "info"}
            autoCapitalize="words"
            enterKeyHint="next"
            autoFocus
            {...register("role")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handlePrimary();
              }
            }}
          />
        )}

        {subStep === 3 && (
          <div className="flex w-full gap-2">
            <Controller
              name="startPeriod"
              control={control}
              render={({ field }) => (
                <DateInput
                  mode={dateMode}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  error={errors.startPeriod?.message}
                  autoFocus
                  onEnter={() => endPeriodRef.current?.focus()}
                  onComplete={() => endPeriodRef.current?.focus()}
                />
              )}
            />
            <Controller
              name="endPeriod"
              control={control}
              render={({ field }) => (
                <DateInput
                  ref={endPeriodRef}
                  mode={dateMode}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  error={errors.endPeriod?.message}
                  onEnter={() => void handlePrimary()}
                  onComplete={() => void handlePrimary()}
                />
              )}
            />
          </div>
        )}

        {subStep === 4 && (
          <TextArea
            placeholder={t("descriptionPlaceholder")}
            infoLabel={errors.description?.message}
            infoType={errors.description ? "error" : "info"}
            row={10}
            autoFocus
            {...register("description")}
          />
        )}

        {subStep === 5 && (
          <TextInput
            placeholder={t("websitePlaceholder")}
            infoLabel={errors.website?.message}
            infoType={errors.website ? "error" : "info"}
            inputMode="url"
            autoCapitalize="none"
            enterKeyHint="next"
            autoFocus
            {...register("website")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handlePrimary();
              }
            }}
          />
        )}

        {subStep === 6 && (
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <LocationInput
                placeholder={t("locationPlaceholder")}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                error={errors.location?.message}
                autoFocus
              />
            )}
          />
        )}
      </div>
    </FormLayout>
  );
};
