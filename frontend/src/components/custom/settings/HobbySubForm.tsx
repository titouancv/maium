"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { SIGNUP_FORM_ID } from "@/constants";
import { TextInput, TextArea } from "@/components/ui";
import { FormLayout } from "@/components/layout/FormLayout";

export const hobbySchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500),
});
export type HobbyData = z.infer<typeof hobbySchema>;

interface Props {
  initialData?: HobbyData;
  onSave: (data: HobbyData) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export const HobbySubForm = ({
  initialData,
  onSave,
  onCancel,
  onDelete,
}: Props) => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<HobbyData>({
    resolver: zodResolver(hobbySchema),
    mode: "onChange",
    defaultValues: initialData ?? { title: "", description: "" },
  });

  return (
    <FormLayout
      title={t("editHobbies")}
      step={1}
      totalSteps={1}
      isCancelable
      onCancel={onCancel}
      cancelLabel={tCommon("cancelButton")}
      primaryLabel={t("saveButton")}
      formId={SIGNUP_FORM_ID}
      secondaryLabel={onDelete ? t("deleteButton") : undefined}
      onSecondary={onDelete}
    >
      <form
        id={SIGNUP_FORM_ID}
        onSubmit={handleSubmit(onSave)}
        className="flex flex-col gap-4"
      >
        <TextInput
          placeholder={t("hobbyTitlePlaceholder")}
          autoFocus
          {...register("title")}
        />
        <TextArea
          placeholder={t("hobbyDescriptionPlaceholder")}
          {...register("description")}
        />
      </form>
    </FormLayout>
  );
};
