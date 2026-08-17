import { NextRequest, NextResponse } from "next/server";
import { LOCALES, ROUTES, type Locale } from "@/constants";
import { routing } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl, readUnsubscribeToken } from "@/lib/email";

async function unsubscribe(token: string | null): Promise<Locale | null> {
  if (!token) return null;

  const userId = readUnsubscribeToken(token);
  if (!userId) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("users")
    .update({ email_notifications: false })
    .eq("id", userId)
    .select("locale")
    .maybeSingle();
  if (error || !data) return null;

  return LOCALES.includes(data.locale as Locale)
    ? (data.locale as Locale)
    : routing.defaultLocale;
}

const invalidToken = () =>
  NextResponse.json({ error: "Invalid token" }, { status: 400 });

export async function GET(request: NextRequest) {
  const locale = await unsubscribe(request.nextUrl.searchParams.get("token"));
  if (!locale) return invalidToken();

  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return NextResponse.redirect(
    new URL(`${prefix}${ROUTES.UNSUBSCRIBED}`, getAppUrl()),
  );
}

export async function POST(request: NextRequest) {
  const locale = await unsubscribe(request.nextUrl.searchParams.get("token"));
  if (!locale) return invalidToken();

  return NextResponse.json({ success: true }, { status: 200 });
}
