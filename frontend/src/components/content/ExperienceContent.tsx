"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useUserStore } from "@/stores/useUserStore";
import { ROUTES } from "@/constants";
import { ExperienceSubWizard } from "../custom/experience/ExperienceSubWizard";
import type { ExperienceFormData, ExperienceType } from "@/types/experience";

interface Props {
  type: ExperienceType;
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

  const isEdu = type === "educational";
  const namespace = isEdu
    ? "experience.educational"
    : "experience.professional";
  const dateMode = "MM-YYYY";
  const experiences = isEdu
    ? user.educationalExperiences
    : user.professionalExperiences;
  const storeKey = isEdu
    ? "educationalExperiences"
    : ("professionalExperiences" as const);

  const initialData = index !== null ? experiences?.[index] : undefined;

  const handleCancel = () => router.push(returnUrl);

  const handleSave = (data: ExperienceFormData) => {
    const current = experiences ?? [];
    const entry = { ...data, endPeriod: data.endPeriod || undefined };
    const updated =
      index !== null
        ? current.map((e, i) => (i === index ? entry : e))
        : [...current, entry];
    setUser({ [storeKey]: updated });
    router.push(returnUrl);
  };

  const handleDelete = () => {
    if (index !== null) {
      const current = experiences ?? [];
      setUser({ [storeKey]: current.filter((_, i) => i !== index) });
    }
    router.push(returnUrl);
  };

  return (
    <ExperienceSubWizard
      namespace={namespace}
      dateMode={dateMode}
      initialData={initialData}
      onSave={handleSave}
      onCancel={handleCancel}
      onDelete={index !== null ? handleDelete : undefined}
    />
  );
};
