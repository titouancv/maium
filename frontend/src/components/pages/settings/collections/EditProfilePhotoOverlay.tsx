"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { useTranslations } from "next-intl";
import {
  API,
  PROFILE_PHOTO_ASPECT,
  PROFILE_PHOTO_MAX_BYTES,
} from "@/constants";
import { FormLayout } from "@/components/layout";
import { Button } from "@/components/ui";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import {
  cropImageToBlob,
  uploadProfilePhoto,
  type CropArea,
} from "@/lib/users/avatar";
import type { UserData } from "@/types";

interface Props {
  user: UserData;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Settings overlay to add or replace the user's profile photo. The picked image
 * is cropped interactively to the 5:7 portrait frame (zoom + drag), exported to
 * a WebP (keeps PNG transparency), uploaded to Storage, and its public URL saved
 * via PATCH /api/users/me.
 * "Delete" clears the photo, reverting to the default avatar.
 */
export const EditProfilePhotoOverlay = ({ user, onClose, onSaved }: Props) => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const currentUserId = useCurrentUserStore((s) => s.user?.id);

  const inputRef = useRef<HTMLInputElement>(null);
  // Preload the existing photo so it opens ready to re-crop (or delete).
  const [imageSrc, setImageSrc] = useState<string | null>(
    user.profile_photo ?? null,
  );
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<CropArea | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Release the object URL created for a picked file when it changes/unmounts.
  // Remote URLs (the preloaded photo) aren't blobs, so they're left untouched.
  useEffect(() => {
    return () => {
      if (imageSrc?.startsWith("blob:")) URL.revokeObjectURL(imageSrc);
    };
  }, [imageSrc]);

  const onCropComplete = useCallback((_: unknown, areaPixels: CropArea) => {
    setCroppedArea(areaPixels);
  }, []);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-picking the same file
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t("profilePhotoErrorType"));
      return;
    }
    if (file.size > PROFILE_PHOTO_MAX_BYTES) {
      setError(t("profilePhotoErrorSize"));
      return;
    }

    setError(null);
    if (imageSrc?.startsWith("blob:")) URL.revokeObjectURL(imageSrc);
    setImageSrc(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const persist = async (profilePhoto: string | null) => {
    const res = await fetch(API.USERS_ME, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profilePhoto }),
    });
    if (!res.ok) throw new Error("save failed");
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedArea || !currentUserId) return;
    setIsSaving(true);
    setError(null);
    try {
      const blob = await cropImageToBlob(imageSrc, croppedArea);
      const url = await uploadProfilePhoto(blob, currentUserId);
      await persist(url);
      onSaved();
      onClose();
    } catch {
      setError(t("profilePhotoErrorUpload"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await persist(null);
      onSaved();
      onClose();
    } catch {
      setError(t("profilePhotoErrorUpload"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-surface-50 fixed inset-0 z-50">
      <FormLayout
        title={t("editProfilePhoto")}
        step={1}
        totalSteps={1}
        isCancelable
        onCancel={onClose}
        cancelLabel={tCommon("cancelButton")}
        primaryLabel={imageSrc ? t("saveButton") : undefined}
        primaryLoading={isSaving}
        onPrimary={handleSave}
        secondaryLabel={user.profile_photo ? t("deleteButton") : undefined}
        onSecondary={user.profile_photo ? handleDelete : undefined}
        error={error ?? undefined}
      >
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6">
          <div className="bg-surface-100 relative aspect-[5/7] w-full max-w-xs overflow-hidden rounded-sm">
            {imageSrc ? (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={PROFILE_PHOTO_ASPECT}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-txt-muted hover:text-primary absolute inset-0 flex items-center justify-center px-6 text-center text-sm"
              >
                {t("profilePhotoChoose")}
              </button>
            )}
          </div>

          {imageSrc && (
            <div className="flex w-full flex-col gap-4">
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label={t("profilePhotoZoom")}
                className="accent-primary w-full"
              />
              <Button
                variant="outline"
                type="button"
                size="md"
                className="w-full"
                onClick={() => inputRef.current?.click()}
              >
                {t("profilePhotoChooseAnother")}
              </Button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </div>
      </FormLayout>
    </div>
  );
};
