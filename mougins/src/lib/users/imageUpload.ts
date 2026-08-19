import { createBrowserClient } from "@/lib/supabase";

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
  outputWidth: number,
  aspect: number,
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  const outputHeight = Math.round(outputWidth / aspect);

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

export async function uploadImage(
  bucket: string,
  path: string,
  blob: Blob,
): Promise<string> {
  const supabase = createBrowserClient();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { upsert: true, contentType: "image/webp" });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return `${publicUrl}?t=${Date.now()}`;
}

export async function deleteImage(bucket: string, path: string): Promise<void> {
  const supabase = createBrowserClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
