"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PROJECT_IMAGE_MAX_BYTES } from "@/constants";
import {
  cropProjectImageToBlob,
  uploadProjectImage,
  type CropArea,
  type UploadedProjectImage,
} from "@/lib/users/projectImages";

export type ProjectImageError = "type" | "size" | "upload";

interface UseProjectImagePickerParams {
  initialSrc?: string | null;
  initialPath?: string | null;
  userId: string | undefined;
}

export function useProjectImagePicker({
  initialSrc,
  initialPath,
  userId,
}: UseProjectImagePickerParams) {
  const [imageSrc, setImageSrc] = useState<string | null>(initialSrc ?? null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<CropArea | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<ProjectImageError | null>(null);
  const imageIdRef = useRef(initialPath?.split("/").pop()?.replace(/\.webp$/, "") ?? crypto.randomUUID());

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
    if (file.size > PROJECT_IMAGE_MAX_BYTES) {
      setError("size");
      return;
    }

    setError(null);
    if (imageSrc?.startsWith("blob:")) URL.revokeObjectURL(imageSrc);
    setImageSrc(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const cropAndUpload = async (): Promise<UploadedProjectImage | null> => {
    if (!imageSrc || !croppedArea || !userId) return null;
    setIsSaving(true);
    setError(null);
    try {
      const blob = await cropProjectImageToBlob(imageSrc, croppedArea);
      return await uploadProjectImage(blob, userId, imageIdRef.current);
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
