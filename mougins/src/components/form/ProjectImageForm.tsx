"use client";

import { useTranslations } from "next-intl";
import { ProjectImagePicker } from "@/components/form/ProjectImagePicker";
import { useProjectImagePicker } from "@/hooks/useProjectImagePicker";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

export interface ProjectImageValue {
  url: string;
  path: string;
}

interface ProjectImageFormProps {
  defaultValue?: ProjectImageValue | null;
  onChange: (value: ProjectImageValue | null) => void;
  isSubmitting?: boolean;
}

export const ProjectImageForm = ({
  defaultValue,
  onChange,
  isSubmitting,
}: ProjectImageFormProps) => {
  const t = useTranslations("settings");
  const currentUserId = useCurrentUserStore((s) => s.user?.id);

  const picker = useProjectImagePicker({
    initialSrc: defaultValue?.url ?? null,
    initialPath: defaultValue?.path ?? null,
    userId: currentUserId,
  });

  const handleSave = async () => {
    const uploaded = await picker.cropAndUpload();
    if (uploaded) onChange(uploaded);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <Text tone="muted" size="sm">
        {t("projectImageStepDescription")}
      </Text>

      <ProjectImagePicker picker={picker} />

      <div className="flex gap-2">
        {picker.hasImage && (
          <Button
            type="button"
            size="lg"
            className="w-full"
            isLoading={picker.isSaving || isSubmitting}
            onClick={handleSave}
          >
            {t("saveButton")}
          </Button>
        )}
        <Button
          type="button"
          variant={picker.hasImage ? "outline" : undefined}
          size="lg"
          className="w-full"
          onClick={() => onChange(null)}
        >
          {t("projectImageSkip")}
        </Button>
      </div>
    </div>
  );
};
