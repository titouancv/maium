import {
  PROJECT_IMAGE_ASPECT,
  PROJECT_IMAGE_BUCKET,
  PROJECT_IMAGE_OUTPUT_WIDTH,
} from "@/constants";
import {
  cropImageToBlob as cropImageToBlobGeneric,
  deleteImage,
  uploadImage,
  type CropArea,
} from "./imageUpload";

export type { CropArea };

export async function cropProjectImageToBlob(
  imageSrc: string,
  crop: CropArea,
): Promise<Blob> {
  return cropImageToBlobGeneric(
    imageSrc,
    crop,
    PROJECT_IMAGE_OUTPUT_WIDTH,
    PROJECT_IMAGE_ASPECT,
  );
}

export interface UploadedProjectImage {
  url: string;
  path: string;
}

export async function uploadProjectImage(
  blob: Blob,
  userId: string,
  imageId: string,
): Promise<UploadedProjectImage> {
  const path = `${userId}/${imageId}.webp`;
  const url = await uploadImage(PROJECT_IMAGE_BUCKET, path, blob);
  return { url, path };
}

export async function deleteProjectImage(path: string): Promise<void> {
  await deleteImage(PROJECT_IMAGE_BUCKET, path);
}
