"use client";

import { useRef } from "react";
import Cropper from "react-easy-crop";
import { useTranslations } from "next-intl";
import { PROFILE_PHOTO_ASPECT } from "@/constants";
import { Button } from "@/components/ui/Button";
import type { useProfilePhotoPicker } from "@/hooks/useProfilePhotoPicker";

interface ProfilePhotoPickerProps {
  /** The whole return value of [useProfilePhotoPicker], which owns the state. */
  picker: ReturnType<typeof useProfilePhotoPicker>;
}

/**
 * Visual half of the profile-photo flow: an empty 5:7 frame that opens the file
 * picker, or the picked image in an interactive cropper with a zoom slider.
 *
 * Presentational only — [useProfilePhotoPicker] holds the state and performs
 * the upload, so the settings overlay and the signup step share both.
 */
export const ProfilePhotoPicker = ({ picker }: ProfilePhotoPickerProps) => {
  const t = useTranslations("settings");
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => inputRef.current?.click();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-picking the same file
    if (file) picker.setImageFromFile(file);
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6">
      <div className="bg-surface-100 relative aspect-[5/7] w-full max-w-xs overflow-hidden rounded-sm">
        {picker.imageSrc ? (
          <Cropper
            image={picker.imageSrc}
            crop={picker.crop}
            zoom={picker.zoom}
            aspect={PROFILE_PHOTO_ASPECT}
            onCropChange={picker.setCrop}
            onZoomChange={picker.setZoom}
            onCropComplete={picker.onCropComplete}
          />
        ) : (
          <button
            type="button"
            onClick={openPicker}
            className="text-txt-muted hover:text-primary absolute inset-0 flex items-center justify-center px-6 text-center text-sm"
          >
            {t("profilePhotoChoose")}
          </button>
        )}
      </div>

      {picker.imageSrc && (
        <div className="flex w-full flex-col gap-4">
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={picker.zoom}
            onChange={(e) => picker.setZoom(Number(e.target.value))}
            aria-label={t("profilePhotoZoom")}
            className="accent-primary hidden w-full md:block"
          />
          <Button
            variant="outline"
            type="button"
            size="md"
            className="w-full"
            onClick={openPicker}
          >
            {t("profilePhotoChooseAnother")}
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
};
