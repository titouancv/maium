"use client";

import { useCallback, useEffect, useState } from "react";
import { API, PROFILE_GALLERY_PHOTO_MAX_BYTES } from "@/constants";
import {
  cropGalleryPhotoToBlob,
  uploadGalleryPhoto,
  type CropArea,
} from "@/lib/users/galleryPhotos";

export type GalleryPhotoError = "type" | "size" | "upload" | "full";

interface UseGalleryPhotoPickerParams {
  userId: string | undefined;
  onAdded: (photo: { id: string; url: string }) => void;
}

export function useGalleryPhotoPicker({
  userId,
  onAdded,
}: UseGalleryPhotoPickerParams) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<CropArea | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<GalleryPhotoError | null>(null);

  useEffect(() => {
    return () => {
      if (imageSrc?.startsWith("blob:")) URL.revokeObjectURL(imageSrc);
    };
  }, [imageSrc]);

  const onCropComplete = useCallback((_: unknown, areaPixels: CropArea) => {
    setCroppedArea(areaPixels);
  }, []);

  const reset = useCallback(() => {
    setImageSrc((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const setImageFromFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("type");
      return;
    }
    if (file.size > PROFILE_GALLERY_PHOTO_MAX_BYTES) {
      setError("size");
      return;
    }

    setError(null);
    if (imageSrc?.startsWith("blob:")) URL.revokeObjectURL(imageSrc);
    setImageSrc(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const cropAndUpload = async (): Promise<boolean> => {
    if (!imageSrc || !croppedArea || !userId) return false;
    setIsSaving(true);
    setError(null);
    try {
      const blob = await cropGalleryPhotoToBlob(imageSrc, croppedArea);
      const { url, path } = await uploadGalleryPhoto(blob, userId);

      const res = await fetch(API.USERS_ME_PHOTOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, path }),
      });
      if (!res.ok) {
        setError(res.status === 422 ? "full" : "upload");
        return false;
      }

      const { id } = await res.json();
      onAdded({ id, url });
      reset();
      return true;
    } catch {
      setError("upload");
      return false;
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
    reset,
  };
}
