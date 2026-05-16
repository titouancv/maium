"use client";

import { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { TextInput } from "@/components/ui/TextInput";
import { DateInput } from "@/components/ui/DateInput";
import { StepLayout } from "@/components/layout/StepLayout";

const MONTH_YEAR = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface ProfessionalExperienceFormData {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
}

interface Props {
  initialData?: Partial<ProfessionalExperienceFormData>;
  onSave: (data: ProfessionalExperienceFormData) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export const ProfessionalExperienceSubWizard = ({
  initialData,
  onSave,
  onCancel,
  onDelete,
}: Props) => {
  const t = useTranslations("auth.signup.step5");
  const [subStep, setSubStep] = useState(1);
  const endDateRef = useRef<HTMLInputElement>(null);
  const TOTAL = 3;

  const schema = z
    .object({
      company: z.string().min(1, t("companyRequired")),
      role: z.string().min(1, t("roleRequired")),
      startDate: z.string().regex(MONTH_YEAR, t("startDateRequired")),
      endDate: z
        .union([
          z.string().regex(MONTH_YEAR, t("endDateRequired")),
          z.literal(""),
        ])
        .optional(),
    })
    .refine(
      (d) =>
        !d.endDate || !MONTH_YEAR.test(d.endDate) || d.endDate >= d.startDate,
      { message: t("endDateBeforeStart"), path: ["endDate"] },
    );

  const {
    register,
    control,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfessionalExperienceFormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      company: initialData?.company ?? "",
      role: initialData?.role ?? "",
      startDate: initialData?.startDate ?? "",
      endDate: initialData?.endDate ?? "",
    },
  });

  const stepFields: Record<number, (keyof ProfessionalExperienceFormData)[]> = {
    1: ["company"],
    2: ["role"],
    3: ["startDate", "endDate"],
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

  const titles = [t("subStep1Title"), t("subStep2Title"), t("subStep3Title")];

  return (
    <StepLayout
      title={titles[subStep - 1]}
      step={subStep}
      totalSteps={TOTAL}
      isCancelable={true}
      onCancel={onCancel}
      cancelLabel={t("cancelButton")}
      primaryLabel={subStep < TOTAL ? t("nextButton") : t("saveButton")}
      onPrimary={handlePrimary}
      secondaryLabel={t("removeEntry")}
      onSecondary={onDelete}
    >
      <div className="flex flex-col gap-3">
        {subStep === 1 && (
          <TextInput
            placeholder={t("companyPlaceholder")}
            infoLabel={errors.company?.message}
            infoType={errors.company ? "error" : "info"}
            autoCapitalize="words"
            enterKeyHint="next"
            autoFocus
            {...register("company")}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handlePrimary(); } }}
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
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handlePrimary(); } }}
          />
        )}

        {subStep === 3 && (
          <div className="flex w-full gap-2">
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <DateInput
                  mode="MM-YYYY"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  error={errors.startDate?.message}
                  autoFocus
                  onEnter={() => endDateRef.current?.focus()}
                />
              )}
            />
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <DateInput
                  ref={endDateRef}
                  mode="MM-YYYY"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  error={errors.endDate?.message}
                  onEnter={() => void handlePrimary()}
                />
              )}
            />
          </div>
        )}
      </div>
    </StepLayout>
  );
};
