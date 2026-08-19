"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Form } from "../Form";
import type { FormProps } from "../Form";
import type { HobbyData } from "@/types/user";
import { HOBBY_CATEGORIES, type HobbyCategory } from "@/constants";
import { faviconUrl, flagUrl, isValidUrl } from "@/lib/utils";

interface Props {
  initialData?: HobbyData;
  onSave: (data: HobbyData) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const getTotalSteps = (category: HobbyCategory): number => {
  if (category === "club") return 4;
  return 3;
};

export const HobbySubForm = ({
  initialData,
  onSave,
  onCancel,
  onDelete,
}: Props) => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [subStep, setSubStep] = useState(1);
  const [values, setValues] = useState<HobbyData>(
    initialData ?? { title: "", description: "", category: "text" },
  );
  const [titleError, setTitleError] = useState<string | undefined>();
  const [websiteError, setWebsiteError] = useState<string | undefined>();

  const base = {
    step: subStep,
    totalSteps: getTotalSteps(values.category),
    isCancelable: true,
    onCancel,
    cancelLabel: tCommon("cancelButton"),
    primaryLabel:
      subStep < getTotalSteps(values.category)
        ? tCommon("nextButton")
        : t("saveButton"),
    secondaryLabel: onDelete ? t("deleteButton") : undefined,
    onSecondary: onDelete,
  };

  const requireTitle = (nextStep: number) => {
    if (!values.title.trim()) {
      setTitleError(t("hobbyTitleRequired"));
      return;
    }
    setSubStep(nextStep);
  };

  const descriptionStepProps = (): FormProps => ({
    ...base,
    type: "longText",
    title: t("hobbySubStep2Title"),
    placeholder: t("hobbyDescriptionPlaceholder"),
    defaultValue: values.description,
    onChange: (v) => setValues((prev) => ({ ...prev, description: v })),
    onPrimary: () => onSave(values),
  });

  const getFormProps = (): FormProps => {
    if (subStep === 1) {
      return {
        ...base,
        type: "select",
        title: t("hobbyCategoryTitle"),
        options: HOBBY_CATEGORIES.map((category) => ({
          value: category,
          label: t(`hobbyCategoryLabel.${category}`),
        })),
        defaultValue: values.category,
        onChange: (value) => {
          const category = value as HobbyCategory;
          setValues((prev) =>
            prev.category === category
              ? prev
              : {
                  title: "",
                  description: prev.description,
                  category,
                  imageUrl: undefined,
                  sourceUrl: undefined,
                },
          );
        },
        onPrimary: () => setSubStep(2),
      };
    }

    if (values.category === "club") {
      if (subStep === 2) {
        return {
          ...base,
          type: "text",
          title: t("hobbyClubNameStepTitle"),
          placeholder: t("hobbyClubNamePlaceholder"),
          defaultValue: values.title,
          onChange: (v) => {
            setValues((prev) => ({ ...prev, title: v }));
            setTitleError(undefined);
          },
          infoLabel: titleError,
          infoType: titleError ? "error" : "info",
          onPrimary: () => requireTitle(3),
        };
      }
      if (subStep === 3) {
        return {
          ...base,
          type: "text",
          title: t("hobbyClubWebsiteStepTitle"),
          placeholder: t("hobbyClubWebsitePlaceholder"),
          defaultValue: values.sourceUrl ?? "",
          onChange: (v) => {
            setValues((prev) => ({ ...prev, sourceUrl: v }));
            setWebsiteError(undefined);
          },
          infoLabel: websiteError,
          infoType: websiteError ? "error" : "info",
          onPrimary: () => {
            const website = (values.sourceUrl ?? "").trim();
            if (website && !isValidUrl(website)) {
              setWebsiteError(t("urlInvalid"));
              return;
            }
            setValues((prev) => ({
              ...prev,
              sourceUrl: website || undefined,
              imageUrl: website ? faviconUrl(website, 64) : undefined,
            }));
            setSubStep(4);
          },
        };
      }
      return descriptionStepProps();
    }

    if (values.category === "place") {
      if (subStep === 2) {
        return {
          ...base,
          type: "hobbyPlace",
          title: t("hobbyPlaceStepTitle"),
          defaultValue: values.title
            ? { countryName: values.title, countryCode: "" }
            : undefined,
          onChange: ({ countryName, countryCode }) => {
            setValues((prev) => ({
              ...prev,
              title: countryName,
              imageUrl: flagUrl(countryCode),
            }));
            setTitleError(undefined);
          },
          onPrimary: () => requireTitle(3),
        };
      }
      return descriptionStepProps();
    }

    if (values.category === "personality") {
      if (subStep === 2) {
        return {
          ...base,
          type: "hobbyPersonality",
          title: t("hobbyPersonalityStepTitle"),
          defaultValue: values.title
            ? {
                title: values.title,
                imageUrl: values.imageUrl,
                sourceUrl: values.sourceUrl,
              }
            : undefined,
          onChange: (value) => {
            setValues((prev) => ({
              ...prev,
              title: value.title,
              imageUrl: value.imageUrl,
              sourceUrl: value.sourceUrl,
            }));
            setTitleError(undefined);
          },
          onPrimary: () => requireTitle(3),
        };
      }
      return descriptionStepProps();
    }

    if (subStep === 2) {
      return {
        ...base,
        type: "text",
        title: t("hobbySubStep1Title"),
        placeholder: t("hobbyTitlePlaceholder"),
        defaultValue: values.title,
        onChange: (v) => {
          setValues((prev) => ({ ...prev, title: v }));
          setTitleError(undefined);
        },
        infoLabel: titleError,
        infoType: titleError ? "error" : "info",
        onPrimary: () => requireTitle(3),
      };
    }
    return descriptionStepProps();
  };

  return <Form key={subStep} {...getFormProps()} />;
};
