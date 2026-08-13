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
  /** Fired with the uploaded photo's public URL once the crop is saved. */
  onChange: (profilePhoto: string) => void;
  /** True while the parent persists the URL — blocks a second upload. */
  isSubmitting?: boolean;
}

/**
 * Signup step for the profile photo. Shares [useProfilePhotoPicker] and
 * [ProfilePhotoPicker] with the settings overlay, so cropping, validation and
 * upload behave identically in both places.
 *
 * The upload button lives here rather than in the wizard's footer because the
 * footer's primary action is "skip" — the step is optional, and a user with no
 * photo should be able to move on without touching a file picker.
 */
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
        // Loading covers the parent's persist too, so the button can't be
        // clicked again between the upload finishing and the PATCH returning —
        // which would re-upload and orphan a Storage object.
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
