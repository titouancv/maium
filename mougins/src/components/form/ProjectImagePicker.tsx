"use client";

import { useRef } from "react";
import Cropper from "react-easy-crop";
import { useTranslations } from "next-intl";
import { PROJECT_IMAGE_ASPECT } from "@/constants";
import { Button } from "@/components/ui/Button";
import { FilePicker, type FilePickerHandle } from "@/components/ui/FilePicker";
import { Text } from "@/components/ui/Text";
import { InfoMessage } from "@/components/ui/InfoMessage";
import type { useProjectImagePicker } from "@/hooks/useProjectImagePicker";

interface ProjectImagePickerProps {
  picker: ReturnType<typeof useProjectImagePicker>;
}

export const ProjectImagePicker = ({ picker }: ProjectImagePickerProps) => {
  const t = useTranslations("settings");
  const fileRef = useRef<FilePickerHandle>(null);

  const openPicker = () => fileRef.current?.open();

  const errorLabel =
    picker.error === "type"
      ? t("profilePhotoErrorType")
      : picker.error === "size"
        ? t("profilePhotoErrorSize")
        : picker.error === "upload"
          ? t("profilePhotoErrorUpload")
          : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div
        className="bg-surface-100 relative w-full overflow-hidden rounded-sm"
        style={{ aspectRatio: PROJECT_IMAGE_ASPECT }}
      >
        {picker.imageSrc ? (
          <Cropper
            image={picker.imageSrc}
            crop={picker.crop}
            zoom={picker.zoom}
            aspect={PROJECT_IMAGE_ASPECT}
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

      <InfoMessage message={errorLabel} />

      {!picker.hasImage && (
        <Text tone="muted" size="sm">
          {t("projectImageOptionalHint")}
        </Text>
      )}
    </div>
  );
};
