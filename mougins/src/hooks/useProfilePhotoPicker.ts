"use client";

import { useCallback, useEffect, useState } from "react";
import { PROFILE_PHOTO_MAX_BYTES } from "@/constants";
import {
  cropImageToBlob,
  uploadProfilePhoto,
  type CropArea,
} from "@/lib/users/avatar";

/** Why a picked file was rejected — the caller maps this to a translated string. */
export type ProfilePhotoError = "type" | "size" | "upload";

interface UseProfilePhotoPickerParams {
  /** Existing photo to open ready-to-re-crop; omit to start from the picker. */
  initialSrc?: string | null;
  /** Auth id of the user the photo belongs to (Storage path is `<userId>/…`). */
  userId: string | undefined;
}

/**
 * Owns everything between "user picks a file" and "here is the public URL":
 * validation, the interactive crop state, and the crop → upload round-trip.
 *
 * Extracted so the settings overlay and the signup step drive the same flow —
 * only their surrounding chrome (titles, buttons, what to do with the URL)
 * differs. Pair it with [ProfilePhotoPicker] for the visual half.
 *
 * Deliberately DOM-free: it takes a `File`, not a change event, and owns no
 * refs. The `<input type="file">` and its ref belong to the component.
 */
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

  // Release the object URL created for a picked file when it changes/unmounts.
  // Remote URLs (a preloaded photo) aren't blobs, so they're left untouched.
  useEffect(() => {
    return () => {
      if (imageSrc?.startsWith("blob:")) URL.revokeObjectURL(imageSrc);
    };
  }, [imageSrc]);

  const onCropComplete = useCallback((_: unknown, areaPixels: CropArea) => {
    setCroppedArea(areaPixels);
  }, []);

  /** Validate a picked file and load it into the cropper. */
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

  /**
   * Crop the current selection, upload it, and return its public URL — or
   * `null` when there is nothing to save or the upload failed (in which case
   * `error` is set). Persisting the URL is the caller's job.
   */
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
