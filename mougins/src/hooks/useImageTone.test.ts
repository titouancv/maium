import { describe, expect, it } from "vitest";
import { imageBackdropTheme, toneFromPixels } from "./useImageTone";

const SIZE = 32;

/** Square sample where the centre disc is `color` and the rest is transparent. */
function sample(color: [number, number, number], alpha = 255) {
  const pixels = new Uint8ClampedArray(SIZE * SIZE * 4);
  const radius = SIZE / 3;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (Math.hypot(x - SIZE / 2, y - SIZE / 2) > radius) continue;
      const i = (y * SIZE + x) * 4;
      pixels.set([...color, alpha], i);
    }
  }
  return pixels;
}

function opaque(color: [number, number, number]) {
  const pixels = new Uint8ClampedArray(SIZE * SIZE * 4);
  for (let i = 0; i < pixels.length; i += 4) pixels.set([...color, 255], i);
  return pixels;
}

describe("toneFromPixels", () => {
  it("flags a black cutout as dark so it gets a light backdrop", () => {
    expect(toneFromPixels(sample([0, 0, 0]))).toBe("dark");
  });

  it("flags a white cutout as light so it gets a dark backdrop", () => {
    expect(toneFromPixels(sample([255, 255, 255]))).toBe("light");
  });

  it("flags a pale cutout as light", () => {
    expect(toneFromPixels(sample([240, 234, 216]))).toBe("light");
  });

  it("leaves a cutout that reads on both surfaces alone", () => {
    expect(toneFromPixels(sample([128, 128, 128]))).toBeNull();
    expect(toneFromPixels(sample([255, 69, 0]))).toBeNull();
  });

  it("leaves opaque images alone, however dark or light", () => {
    expect(toneFromPixels(opaque([0, 0, 0]))).toBeNull();
    expect(toneFromPixels(opaque([255, 255, 255]))).toBeNull();
  });

  it("ignores near-transparent pixels", () => {
    expect(toneFromPixels(sample([0, 0, 0], 8))).toBeNull();
  });
});

describe("imageBackdropTheme", () => {
  it("pairs each tone with the opposite surface", () => {
    expect(imageBackdropTheme("dark")).toBe("light");
    expect(imageBackdropTheme("light")).toBe("dark");
    expect(imageBackdropTheme(null)).toBeUndefined();
  });
});
