import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { ROUTES } from "@/constants";
import { getAuthUser } from "@/lib/auth/getCurrentUser";
import { AnalyzeContent } from "@/components/pages/analyze";

export default async function AnalyzePage() {
  const [locale, user] = await Promise.all([getLocale(), getAuthUser()]);
  if (user) redirect({ href: ROUTES.JOBS, locale });

  return <AnalyzeContent />;
}
