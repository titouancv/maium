"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Form } from "../Form";
import type { FormProps } from "../Form";
import type { Project } from "@/types/user";
import { isValidUrl } from "@/lib/utils";

const TOTAL_SUB_STEPS = 5;

interface Props {
  initialData?: Project;
  onSave: (data: Project) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export const ProjectSubForm = ({
  initialData,
  onSave,
  onCancel,
  onDelete,
}: Props) => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [subStep, setSubStep] = useState(1);
  const [values, setValues] = useState<Project>(initialData ?? { title: "" });
  const [titleError, setTitleError] = useState<string | undefined>();
  const [websiteError, setWebsiteError] = useState<string | undefined>();
  const [githubError, setGithubError] = useState<string | undefined>();

  const base = {
    step: subStep,
    totalSteps: TOTAL_SUB_STEPS,
    isCancelable: true,
    onCancel,
    cancelLabel: tCommon("cancelButton"),
    primaryLabel:
      subStep < TOTAL_SUB_STEPS ? tCommon("nextButton") : undefined,
    secondaryLabel: onDelete ? t("deleteButton") : undefined,
    onSecondary: onDelete,
  };

  const getFormProps = (): FormProps => {
    switch (subStep) {
      case 1:
        return {
          ...base,
          type: "text",
          title: t("projectTitleStepTitle"),
          placeholder: t("projectTitlePlaceholder"),
          defaultValue: values.title,
          onChange: (v) => {
            setValues((prev) => ({ ...prev, title: v }));
            setTitleError(undefined);
          },
          infoLabel: titleError,
          infoType: titleError ? "error" : "info",
          onPrimary: () => {
            if (!values.title.trim()) {
              setTitleError(t("projectTitleRequired"));
              return;
            }
            setSubStep(2);
          },
        };
      case 2:
        return {
          ...base,
          type: "longText",
          title: t("projectBioStepTitle"),
          placeholder: t("projectBioPlaceholder"),
          defaultValue: values.bio ?? "",
          onChange: (v) =>
            setValues((prev) => ({ ...prev, bio: v || undefined })),
          onPrimary: () => setSubStep(3),
        };
      case 3:
        return {
          ...base,
          type: "text",
          title: t("projectWebsiteStepTitle"),
          placeholder: t("projectWebsitePlaceholder"),
          defaultValue: values.websiteUrl ?? "",
          onChange: (v) => {
            setValues((prev) => ({ ...prev, websiteUrl: v || undefined }));
            setWebsiteError(undefined);
          },
          infoLabel: websiteError,
          infoType: websiteError ? "error" : "info",
          onPrimary: () => {
            const website = (values.websiteUrl ?? "").trim();
            if (website && !isValidUrl(website)) {
              setWebsiteError(t("urlInvalid"));
              return;
            }
            setSubStep(4);
          },
        };
      case 4:
        return {
          ...base,
          type: "text",
          title: t("projectGithubStepTitle"),
          placeholder: t("projectGithubPlaceholder"),
          defaultValue: values.githubUrl ?? "",
          onChange: (v) => {
            setValues((prev) => ({ ...prev, githubUrl: v || undefined }));
            setGithubError(undefined);
          },
          infoLabel: githubError,
          infoType: githubError ? "error" : "info",
          onPrimary: () => {
            const github = (values.githubUrl ?? "").trim();
            if (github && !isValidUrl(github)) {
              setGithubError(t("urlInvalid"));
              return;
            }
            setSubStep(5);
          },
        };
      default:
        return {
          ...base,
          type: "projectImage",
          title: t("projectImageStepTitle"),
          defaultValue:
            values.imageUrl && values.imagePath
              ? { url: values.imageUrl, path: values.imagePath }
              : null,
          onChange: (value) =>
            onSave({
              ...values,
              imageUrl: value?.url,
              imagePath: value?.path,
            }),
        };
    }
  };

  return <Form key={subStep} {...getFormProps()} />;
};
