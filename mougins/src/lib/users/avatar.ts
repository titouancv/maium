import { createBrowserClient } from "@/lib/supabase";
import {
  PROFILE_PHOTO_ASPECT,
  PROFILE_PHOTO_BUCKET,
  PROFILE_PHOTO_OUTPUT_WIDTH,
} from "@/constants";

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export async function cropImageToBlob(
  imageSrc: string,
  crop: CropArea,
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  const outputWidth = PROFILE_PHOTO_OUTPUT_WIDTH;
  const outputHeight = Math.round(outputWidth / PROFILE_PHOTO_ASPECT);

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Could not export image")),
      "image/webp",
      0.9,
    );
  });
}

export async function uploadProfilePhoto(
  blob: Blob,
  userId: string,
): Promise<string> {
  const supabase = createBrowserClient();
  const path = `${userId}/avatar.webp`;

  const { error } = await supabase.storage
    .from(PROFILE_PHOTO_BUCKET)
    .upload(path, blob, { upsert: true, contentType: "image/webp" });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(PROFILE_PHOTO_BUCKET).getPublicUrl(path);

  return `${publicUrl}?t=${Date.now()}`;
}
