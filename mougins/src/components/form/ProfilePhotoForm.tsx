"use client";

import { useTranslations } from "next-intl";
import { ProfilePhotoPicker } from "@/components/ui/ProfilePhotoPicker";
import { useProfilePhotoPicker } from "@/hooks/useProfilePhotoPicker";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { InfoMessage } from "@/components/ui/InfoMessage";

interface ProfilePhotoFormProps {
  defaultValue?: string;
  onChange: (profilePhoto: string) => void;
  isSubmitting?: boolean;
}

export const ProfilePhotoForm = ({
  defaultValue,
  onChange,
  isSubmitting,
}: ProfilePhotoFormProps) => {
  const t = useTranslations("form.profilePhoto");
  const tSettings = useTranslations("settings");
  const currentUserId = useCurrentUserStore((s) => s.user?.id);

  const picker = useProfilePhotoPicker({
    initialSrc: defaultValue ?? null,
    userId: currentUserId,
  });

  const errorLabel =
    picker.error === "type"
      ? tSettings("profilePhotoErrorType")
      : picker.error === "size"
        ? tSettings("profilePhotoErrorSize")
        : picker.error === "upload"
          ? tSettings("profilePhotoErrorUpload")
          : null;

  const handleSave = async () => {
    const url = await picker.cropAndUpload();
    if (url) onChange(url);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <Text tone="muted" size="sm">
        {t("description")}
      </Text>

      <ProfilePhotoPicker picker={picker} />

      {picker.hasImage && (
        <Button
          type="button"
          size="lg"
          className="w-full"
          isLoading={picker.isSaving || isSubmitting}
          onClick={handleSave}
        >
          {t("save")}
        </Button>
      )}

      <InfoMessage message={errorLabel} />
    </div>
  );
};
