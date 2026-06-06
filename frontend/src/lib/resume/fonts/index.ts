import path from "node:path";
import { Font } from "@react-pdf/renderer";

// Cabinet Grotesk is the app's brand font (see src/app/fonts.ts). @react-pdf
// can't read the .woff2 files used by the web app, so we register the .ttf
// variants here. Paths are resolved from the project root at render time
// (fontkit reads them from disk); next.config.ts traces these files into the
// serverless bundle via `outputFileTracingIncludes`.
const FONT_DIR = path.join(process.cwd(), "src/lib/resume/fonts");

export const RESUME_FONT_FAMILY = "Cabinet Grotesk";

let registered = false;

/** Registers Cabinet Grotesk once so PDF templates can use it. */
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
  // Disable the default hyphenation: words that don't fit a line wrap whole
  // instead of being split mid-word. Returning the word as a single segment
  // tells @react-pdf there is no valid break point inside it.
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}
