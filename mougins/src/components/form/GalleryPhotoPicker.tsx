"use client";

import { useRef } from "react";
import Cropper from "react-easy-crop";
import { useTranslations } from "next-intl";
import { PROFILE_GALLERY_PHOTO_ASPECT } from "@/constants";
import { Button } from "@/components/ui/Button";
import { FilePicker, type FilePickerHandle } from "@/components/ui/FilePicker";
import type { useGalleryPhotoPicker } from "@/hooks/useGalleryPhotoPicker";

interface GalleryPhotoPickerProps {
  picker: ReturnType<typeof useGalleryPhotoPicker>;
}

export const GalleryPhotoPicker = ({ picker }: GalleryPhotoPickerProps) => {
  const t = useTranslations("settings");
  const fileRef = useRef<FilePickerHandle>(null);

  const openPicker = () => fileRef.current?.open();

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-6">
      <div
        className="bg-surface-100 relative w-full overflow-hidden rounded-sm"
        style={{ aspectRatio: PROFILE_GALLERY_PHOTO_ASPECT }}
      >
        {picker.imageSrc ? (
          <Cropper
            image={picker.imageSrc}
            crop={picker.crop}
            zoom={picker.zoom}
            aspect={PROFILE_GALLERY_PHOTO_ASPECT}
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

      <FilePicker
        ref={fileRef}
        accept="image/*"
        onPick={picker.setImageFromFile}
      />
    </div>
  );
};
