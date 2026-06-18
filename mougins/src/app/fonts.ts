import localFont from "next/font/local";

export const cabinetGrotesk = localFont({
  src: [
    {
      path: "../../public/fonts/cabinet-grotesk/CabinetGrotesk-Thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../public/fonts/cabinet-grotesk/CabinetGrotesk-Extralight.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/fonts/cabinet-grotesk/CabinetGrotesk-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/cabinet-grotesk/CabinetGrotesk-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/cabinet-grotesk/CabinetGrotesk-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/cabinet-grotesk/CabinetGrotesk-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/cabinet-grotesk/CabinetGrotesk-Extrabold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/fonts/cabinet-grotesk/CabinetGrotesk-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-cabinet-grotesk",
  display: "swap",
});
