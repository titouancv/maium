import {
  PROFILE_GALLERY_PHOTO_ASPECT,
  PROFILE_GALLERY_PHOTOS_BUCKET,
  PROFILE_GALLERY_PHOTO_OUTPUT_WIDTH,
} from "@/constants";
import {
  cropImageToBlob as cropImageToBlobGeneric,
  uploadImage,
  type CropArea,
} from "./imageUpload";

export type { CropArea };

export async function cropGalleryPhotoToBlob(
  imageSrc: string,
  crop: CropArea,
): Promise<Blob> {
  return cropImageToBlobGeneric(
    imageSrc,
    crop,
    PROFILE_GALLERY_PHOTO_OUTPUT_WIDTH,
    PROFILE_GALLERY_PHOTO_ASPECT,
  );
}

export interface UploadedGalleryPhoto {
  url: string;
  path: string;
}

export async function uploadGalleryPhoto(
  blob: Blob,
  userId: string,
): Promise<UploadedGalleryPhoto> {
  const path = `${userId}/${crypto.randomUUID()}.webp`;
  const url = await uploadImage(PROFILE_GALLERY_PHOTOS_BUCKET, path, blob);
  return { url, path };
}
