"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { TextInput } from "@/components/ui/TextInput";
import { StepLayout } from "@/components/layout/StepLayout";

const YEAR = /^\d{4}$/;

export interface EducationalExperienceFormData {
  school: string;
  fieldOfStudy: string;
  description: string;
  website: string;
  startYear: string;
  endYear: string; // empty string means no end year
}

interface Props {
  initialData?: Partial<EducationalExperienceFormData>;
  onSave: (data: EducationalExperienceFormData) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export const EducationalExperienceSubWizard = ({
  initialData,
  onSave,
  onCancel,
  onDelete,
}: Props) => {
  const t = useTranslations("auth.signup.step6");
  const [subStep, setSubStep] = useState(1);
  const TOTAL = 4;

  const schema = z
    .object({
      school: z.string().min(1, t("schoolRequired")),
      fieldOfStudy: z.string().min(1, t("fieldOfStudyRequired")),
      description: z.string().max(500).or(z.literal("")),
      website: z.union([z.string().url(t("websiteInvalid")), z.literal("")]),
      startYear: z.string().regex(YEAR, t("startYearRequired")),
      endYear: z.union([z.string().regex(YEAR), z.literal("")]),
    })
    .refine(
      (d) =>
        !d.endYear ||
        !YEAR.test(d.endYear) ||
        Number(d.endYear) >= Number(d.startYear),
      { message: t("endYearBeforeStart"), path: ["endYear"] },
    );

  const {
    register,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<EducationalExperienceFormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      school: initialData?.school ?? "",
      fieldOfStudy: initialData?.fieldOfStudy ?? "",
      description: initialData?.description ?? "",
      website: initialData?.website ?? "",
      startYear: initialData?.startYear ?? "",
      endYear: initialData?.endYear ?? "",
    },
  });

  const stepFields: Record<number, (keyof EducationalExperienceFormData)[]> = {
    1: ["school"],
    2: ["fieldOfStudy"],
    3: ["startYear", "endYear"],
    4: ["description", "website"],
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
  ];

  return (
    <StepLayout
      title={titles[subStep - 1]}
      step={subStep}
      totalSteps={TOTAL}
      isCancelable={true}
      onCancel={onCancel}
      cancelLabel={t("cancelButton")}
      primaryLabel={subStep < TOTAL ? t("nextButton") : t("submitButton")}
      onPrimary={handlePrimary}
      secondaryLabel={t("removeEntry")}
      onSecondary={onDelete}
    >
      <div className="flex flex-col gap-3">
        {subStep === 1 && (
          <TextInput
            placeholder={t("schoolPlaceholder")}
            infoLabel={errors.school?.message}
            infoType={errors.school ? "error" : "info"}
            autoCapitalize="words"
            autoFocus
            {...register("school")}
          />
        )}

        {subStep === 2 && (
          <TextInput
            placeholder={t("fieldOfStudyPlaceholder")}
            infoLabel={errors.fieldOfStudy?.message}
            infoType={errors.fieldOfStudy ? "error" : "info"}
            autoCapitalize="words"
            autoFocus
            {...register("fieldOfStudy")}
          />
        )}

        {subStep === 3 && (
          <div className="flex w-full gap-2">
            <TextInput
              placeholder={t("startYearPlaceholder")}
              infoLabel={errors.startYear?.message}
              infoType={errors.startYear ? "error" : "info"}
              inputMode="numeric"
              autoFocus
              {...register("startYear")}
            />
            <TextInput
              placeholder={t("endYearPlaceholder")}
              infoLabel={errors.endYear?.message}
              infoType={errors.endYear ? "error" : "info"}
              inputMode="numeric"
              {...register("endYear")}
            />
          </div>
        )}

        {subStep === 4 && (
          <>
            <TextInput
              placeholder={t("descriptionPlaceholder")}
              infoLabel={errors.description?.message}
              infoType={errors.description ? "error" : "info"}
              autoFocus
              {...register("description")}
            />
            <TextInput
              placeholder={t("websitePlaceholder")}
              infoLabel={errors.website?.message}
              infoType={errors.website ? "error" : "info"}
              inputMode="url"
              autoCapitalize="none"
              {...register("website")}
            />
          </>
        )}
      </div>
    </StepLayout>
  );
};
