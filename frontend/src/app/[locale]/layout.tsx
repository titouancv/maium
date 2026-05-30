import type { Metadata } from "next";
import "../globals.css";
import { cabinetGrotesk } from "../fonts";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { routing } from "@/i18n/routing";
import { Providers } from "@/components/Providers";
import { UserHydration } from "@/components/UserHydration";
import { getCurrentUserProfile } from "@/lib/auth/getCurrentUser";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "maium",
  description: "maium social network",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  // Start user fetch eagerly — runs in parallel with the awaits below.
  // Cached via React cache() so the page calling getCurrentUserProfile()
  // reuses this same in-flight promise instead of refetching.
  const userPromise = getCurrentUserProfile();

  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${cabinetGrotesk.variable} h-full overflow-hidden antialiased`}
    >
      <body className="flex h-full flex-col overflow-hidden font-bold">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Suspense fallback={null}>
              <UserHydration userPromise={userPromise} />
            </Suspense>
            {children}
          </Providers>
        </NextIntlClientProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
