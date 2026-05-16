"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useUserStore } from "@/stores/useUserStore";
import { ROUTES } from "@/constants";
import {
  ProfessionalExperienceSubWizard,
  type ProfessionalExperienceFormData,
} from "../custom/experience/ProfessionalExperienceSubWizard";
import {
  EducationalExperienceSubWizard,
  type EducationalExperienceFormData,
} from "../custom/experience/EducationalExperienceSubWizard";

interface Props {
  type: "professional" | "educational";
}

export const ExperienceContent = ({ type }: Props) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, setUser } = useUserStore();

  const indexParam = searchParams.get("index");
  const index = indexParam !== null ? parseInt(indexParam, 10) : null;

  const returnUrlParam = searchParams.get("returnUrl");
  const returnUrl = returnUrlParam
    ? decodeURIComponent(returnUrlParam)
    : ROUTES.HOME;

  useEffect(() => {
    if (!user) router.replace(ROUTES.SIGNUP);
  }, [user, router]);

  if (!user) return null;

  const handleCancel = () => router.push(returnUrl);

  if (type === "professional") {
    const initialData =
      index !== null ? user.professionalExperiences?.[index] : undefined;

    const handleSave = (data: ProfessionalExperienceFormData) => {
      const current = user.professionalExperiences ?? [];
      const entry = {
        ...data,
        endDate: data.endDate || undefined,
        current: !data.endDate,
      };
      const updated =
        index !== null
          ? current.map((e, i) => (i === index ? entry : e))
          : [...current, entry];
      setUser({ professionalExperiences: updated });
      router.push(returnUrl);
    };

    const handleDelete = () => {
      if (index !== null) {
        const current = user.professionalExperiences ?? [];
        setUser({
          professionalExperiences: current.filter((_, i) => i !== index),
        });
      }
      router.push(returnUrl);
    };

    return (
      <ProfessionalExperienceSubWizard
        initialData={initialData}
        onSave={handleSave}
        onCancel={handleCancel}
        onDelete={index !== null ? handleDelete : undefined}
      />
    );
  }

  const initialData =
    index !== null ? user.educationalExperiences?.[index] : undefined;

  const handleSave = (data: EducationalExperienceFormData) => {
    const current = user.educationalExperiences ?? [];
    const entry = {
      ...data,
      description: data.description || undefined,
      website: data.website || undefined,
      endYear: data.endYear || undefined,
    };
    const updated =
      index !== null
        ? current.map((e, i) => (i === index ? entry : e))
        : [...current, entry];
    setUser({ educationalExperiences: updated });
    router.push(returnUrl);
  };

  const handleDelete = () => {
    if (index !== null) {
      const current = user.educationalExperiences ?? [];
      setUser({
        educationalExperiences: current.filter((_, i) => i !== index),
      });
    }
    router.push(returnUrl);
  };

  return (
    <EducationalExperienceSubWizard
      initialData={initialData}
      onSave={handleSave}
      onCancel={handleCancel}
      onDelete={index !== null ? handleDelete : undefined}
    />
  );
};
