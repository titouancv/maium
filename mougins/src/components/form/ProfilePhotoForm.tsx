"use client";

import { useTranslations } from "next-intl";
import { ProfilePhotoPicker } from "@/components/ui/ProfilePhotoPicker";
import { useProfilePhotoPicker } from "@/hooks/useProfilePhotoPicker";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { Button } from "@/components/ui/Button";

interface ProfilePhotoFormProps {
  defaultValue?: string;
  /** Fired with the uploaded photo's public URL once the crop is saved. */
  onChange: (profilePhoto: string) => void;
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
      <p className="text-txt-muted text-sm">{t("description")}</p>

      <ProfilePhotoPicker picker={picker} />

      {picker.hasImage && (
        <Button
          type="button"
          size="lg"
          className="w-full"
          isLoading={picker.isSaving}
          onClick={handleSave}
        >
          {t("save")}
        </Button>
      )}

      {errorLabel && <p className="text-error text-sm">{errorLabel}</p>}
    </div>
  );
};
