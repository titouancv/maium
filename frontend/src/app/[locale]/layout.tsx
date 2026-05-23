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
import { createClient } from "@/lib/supabase/server";
import type { UserData } from "@/types";

export const metadata: Metadata = {
  title: "maium",
  description: "maium social network",
};

async function fetchCurrentUser(): Promise<UserData | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data } = await supabase
    .from("users")
    .select(
      "email, first_name, last_name, pseudo, dob, onboarding_completed, phone, nationality, location, professional_experiences, educational_experiences, social_networks, hobbies, personal_experiences, skills, projects",
    )
    .eq("id", authUser.id)
    .single();

  if (!data) return null;
  return {
    ...data,
    dob: data.dob ? new Date(data.dob + "T00:00:00Z").getTime() : null,
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  // Start user fetch eagerly — runs in parallel with the awaits below
  const userPromise = fetchCurrentUser();

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
      </body>
    </html>
  );
}
