import type { Metadata } from "next";
import "./globals.css";
import { cabinetGrotesk, nohemi } from "./fonts";

export const metadata: Metadata = {
  title: "maium",
  description: "maium social network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nohemi.variable} ${cabinetGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
