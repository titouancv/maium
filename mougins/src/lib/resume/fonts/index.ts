import path from "node:path";
import { Font } from "@react-pdf/renderer";

const FONT_DIR = path.join(process.cwd(), "src/lib/resume/fonts");

export const RESUME_FONT_FAMILY = "Cabinet Grotesk";

let registered = false;

export function registerResumeFonts() {
  if (registered) return;
  Font.register({
    family: RESUME_FONT_FAMILY,
    fonts: [
      { src: path.join(FONT_DIR, "CabinetGrotesk-Regular.ttf"), fontWeight: 400 },
      { src: path.join(FONT_DIR, "CabinetGrotesk-Medium.ttf"), fontWeight: 500 },
      { src: path.join(FONT_DIR, "CabinetGrotesk-Bold.ttf"), fontWeight: 700 },
      { src: path.join(FONT_DIR, "CabinetGrotesk-Extrabold.ttf"), fontWeight: 800 },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}
