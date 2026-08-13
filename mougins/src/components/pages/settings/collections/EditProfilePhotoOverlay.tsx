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

/**
 * Settings overlay to add or replace the user's profile photo. The picking,
 * cropping and upload live in [useProfilePhotoPicker] / [ProfilePhotoPicker],
 * shared with the signup wizard's photo step; this component only adds the
 * settings chrome and the "delete" action.
 */
export const EditProfilePhotoOverlay = ({ user, onClose, onSaved }: Props) => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const currentUserId = useCurrentUserStore((s) => s.user?.id);

  // Preload the existing photo so it opens ready to re-crop (or delete).
  const picker = useProfilePhotoPicker({
    initialSrc: user.profile_photo,
    userId: currentUserId,
  });
  // Covers the persist step too, so the primary button stays inert between the
  // upload finishing and the PATCH returning — a second click there would
  // re-crop, re-upload and orphan a Storage object.
  const [isPersisting, setIsPersisting] = useState(false);

  // A single error channel: a failed persist reuses the picker's `upload`
  // error, so picking a new file clears it like any other. A separate flag
  // would linger and mask the next file's type/size error.
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
