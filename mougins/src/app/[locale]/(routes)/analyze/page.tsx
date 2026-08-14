import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { ROUTES } from "@/constants";
import { getAuthUser } from "@/lib/auth/getCurrentUser";
import { isAnonQuotaExhausted } from "@/lib/analyze/anonQuota";
import { AnalyzeContent } from "@/components/pages/analyze";

export default async function AnalyzePage() {
  const [locale, user, freeRunSpent] = await Promise.all([
    getLocale(),
    getAuthUser(),
    isAnonQuotaExhausted(),
  ]);
  if (user) redirect({ href: ROUTES.JOBS, locale });

  return <AnalyzeContent initialFreeRunSpent={freeRunSpent} />;
}
