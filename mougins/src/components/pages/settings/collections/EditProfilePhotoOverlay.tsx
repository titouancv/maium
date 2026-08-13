"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FormLayout } from "@/components/layout";
import { Overlay } from "@/components/ui/Overlay";
import { ProfilePhotoPicker } from "@/components/ui/ProfilePhotoPicker";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { useProfilePhotoPicker } from "@/hooks/useProfilePhotoPicker";
import { updateProfile } from "@/lib/users/updateProfile";
import type { UserData } from "@/types";

interface Props {
  user: UserData;
  onClose: () => void;
  onSaved: () => void;
}

export const EditProfilePhotoOverlay = ({ user, onClose, onSaved }: Props) => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const currentUserId = useCurrentUserStore((s) => s.user?.id);

  const picker = useProfilePhotoPicker({
    initialSrc: user.profile_photo,
    userId: currentUserId,
  });
  const [isPersisting, setIsPersisting] = useState(false);

  const errorLabel =
    picker.error === "type"
      ? t("profilePhotoErrorType")
      : picker.error === "size"
        ? t("profilePhotoErrorSize")
        : picker.error === "upload"
          ? t("profilePhotoErrorUpload")
          : undefined;

  const persist = async (profilePhoto: string | null) => {
    setIsPersisting(true);
    const ok = await updateProfile({ profilePhoto });
    setIsPersisting(false);
    if (!ok) {
      picker.setError("upload");
      return;
    }
    onSaved();
    onClose();
  };

  const handleSave = async () => {
    const url = await picker.cropAndUpload();
    if (!url) return; // `picker.error` already explains why
    await persist(url);
  };

  const handleDelete = () => persist(null);

  return (
    <Overlay onClose={onClose}>
      <FormLayout
        title={t("editProfilePhoto")}
        step={1}
        totalSteps={1}
        isCancelable
        onCancel={onClose}
        cancelLabel={tCommon("cancelButton")}
        primaryLabel={picker.hasImage ? t("saveButton") : undefined}
        primaryLoading={picker.isSaving || isPersisting}
        onPrimary={handleSave}
        secondaryLabel={user.profile_photo ? t("deleteButton") : undefined}
        onSecondary={user.profile_photo ? handleDelete : undefined}
        error={errorLabel}
      >
        <ProfilePhotoPicker picker={picker} />
      </FormLayout>
    </Overlay>
  );
};
