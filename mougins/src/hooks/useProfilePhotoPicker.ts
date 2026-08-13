"use client";

import { useCallback, useEffect, useState } from "react";
import { PROFILE_PHOTO_MAX_BYTES } from "@/constants";
import {
  cropImageToBlob,
  uploadProfilePhoto,
  type CropArea,
} from "@/lib/users/avatar";

export type ProfilePhotoError = "type" | "size" | "upload";

interface UseProfilePhotoPickerParams {
  initialSrc?: string | null;
  userId: string | undefined;
}

export function useProfilePhotoPicker({
  initialSrc,
  userId,
}: UseProfilePhotoPickerParams) {
  const [imageSrc, setImageSrc] = useState<string | null>(initialSrc ?? null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<CropArea | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<ProfilePhotoError | null>(null);

  useEffect(() => {
    return () => {
      if (imageSrc?.startsWith("blob:")) URL.revokeObjectURL(imageSrc);
    };
  }, [imageSrc]);

  const onCropComplete = useCallback((_: unknown, areaPixels: CropArea) => {
    setCroppedArea(areaPixels);
  }, []);

  const setImageFromFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("type");
      return;
    }
    if (file.size > PROFILE_PHOTO_MAX_BYTES) {
      setError("size");
      return;
    }

    setError(null);
    if (imageSrc?.startsWith("blob:")) URL.revokeObjectURL(imageSrc);
    setImageSrc(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const cropAndUpload = async (): Promise<string | null> => {
    if (!imageSrc || !croppedArea || !userId) return null;
    setIsSaving(true);
    setError(null);
    try {
      const blob = await cropImageToBlob(imageSrc, croppedArea);
      return await uploadProfilePhoto(blob, userId);
    } catch {
      setError("upload");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    imageSrc,
    hasImage: imageSrc !== null,
    crop,
    setCrop,
    zoom,
    setZoom,
    onCropComplete,
    setImageFromFile,
    isSaving,
    error,
    setError,
    cropAndUpload,
  };
}
