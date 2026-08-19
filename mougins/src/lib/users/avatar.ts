import {
  PROFILE_PHOTO_ASPECT,
  PROFILE_PHOTO_BUCKET,
  PROFILE_PHOTO_OUTPUT_WIDTH,
} from "@/constants";
import {
  cropImageToBlob as cropImageToBlobGeneric,
  uploadImage,
  type CropArea,
} from "./imageUpload";

export type { CropArea };

export async function cropImageToBlob(
  imageSrc: string,
  crop: CropArea,
): Promise<Blob> {
  return cropImageToBlobGeneric(
    imageSrc,
    crop,
    PROFILE_PHOTO_OUTPUT_WIDTH,
    PROFILE_PHOTO_ASPECT,
  );
}

export async function uploadProfilePhoto(
  blob: Blob,
  userId: string,
): Promise<string> {
  return uploadImage(PROFILE_PHOTO_BUCKET, `${userId}/avatar.webp`, blob);
}
