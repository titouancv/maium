"use client";

import { useEffect, useState } from "react";

/**
 * Tone of an image that has transparent areas (logo, icon, cutout PNG):
 * - "dark"  → its pixels wash out on a dark surface, it needs a light one
 * - "light" → its pixels wash out on a light surface, it needs a dark one
 * - null    → opaque image, readable on both surfaces, or tone could not be
 *             read (CORS, decode error)
 */
export type ImageTone = "dark" | "light" | null;

const SAMPLE_SIZE = 32;
/** Below that share of fully transparent pixels the image is treated as a photo. */
const MIN_TRANSPARENT_RATIO = 0.1;
const MIN_ALPHA = 16;
/** Relative luminance of --light-50 and --dark-900, the two surface-50 values. */
const LIGHT_SURFACE_LUMINANCE = 0.9;
const DARK_SURFACE_LUMINANCE = 0.002;
/** Contrast ratio under which a pixel washes out into the surface. */
const MIN_CONTRAST = 2;
/** Share of lost pixels tolerated before forcing a surface. */
const MAX_LOST_RATIO = 0.25;

/** sRGB channel → linear light, precomputed for the 256 possible values. */
const LINEAR_CHANNEL = Array.from({ length: 256 }, (_, value) => {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
});

const contrast = (a: number, b: number) =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const toneCache = new Map<string, ImageTone>();

/** Classifies the RGBA pixels of a square sample. Exported for testing. */
export function toneFromPixels(pixels: Uint8ClampedArray): ImageTone {
  let transparent = 0;
  let visible = 0;
  let lostOnLight = 0;
  let lostOnDark = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < MIN_ALPHA) {
      transparent++;
      continue;
    }
    visible++;

    const luminance =
      0.2126 * LINEAR_CHANNEL[pixels[i]] +
      0.7152 * LINEAR_CHANNEL[pixels[i + 1]] +
      0.0722 * LINEAR_CHANNEL[pixels[i + 2]];

    if (contrast(luminance, LIGHT_SURFACE_LUMINANCE) < MIN_CONTRAST)
      lostOnLight++;
    if (contrast(luminance, DARK_SURFACE_LUMINANCE) < MIN_CONTRAST)
      lostOnDark++;
  }

  const total = pixels.length / 4;
  if (!visible || transparent / total < MIN_TRANSPARENT_RATIO) return null;

  const lightRatio = lostOnLight / visible;
  const darkRatio = lostOnDark / visible;
  if (lightRatio <= MAX_LOST_RATIO && darkRatio <= MAX_LOST_RATIO) return null;

  return lightRatio < darkRatio ? "dark" : "light";
}

function readTone(image: HTMLImageElement): ImageTone {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

  try {
    return toneFromPixels(
      ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data,
    );
  } catch {
    return null; // tainted canvas: the host does not allow cross-origin reads
  }
}

/** Theme to force on the surface behind the image so it stays readable. */
export function imageBackdropTheme(
  tone: ImageTone,
): "light" | "dark" | undefined {
  if (tone === "dark") return "light";
  if (tone === "light") return "dark";
  return undefined;
}

export function useImageTone(src?: string): ImageTone {
  const [analyzed, setAnalyzed] = useState<{
    src: string;
    tone: ImageTone;
  } | null>(null);

  useEffect(() => {
    if (!src || toneCache.has(src)) return;

    let cancelled = false;
    const image = new Image();
    image.crossOrigin = "anonymous";

    const resolve = (tone: ImageTone) => {
      toneCache.set(src, tone);
      if (!cancelled) setAnalyzed({ src, tone });
    };

    image.onload = () => resolve(readTone(image));
    image.onerror = () => resolve(null);
    image.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!src) return null;
  if (analyzed?.src === src) return analyzed.tone;
  return toneCache.get(src) ?? null;
}
