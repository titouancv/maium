import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { ROUTES } from "@/constants";
import { getAuthUser } from "@/lib/auth/getCurrentUser";
import { AnalyzeContent } from "@/components/pages/analyze";

/**
 * Public analysis funnel. Deliberately outside `PROTECTED_PREFIXES` — it exists
 * to show a signed-out visitor what the product does.
 *
 * A signed-in user has no business here: their profile already backs `/jobs`,
 * with no per-run limit, so they are sent there.
 */
export default async function AnalyzePage() {
  const [locale, user] = await Promise.all([getLocale(), getAuthUser()]);
  if (user) redirect({ href: ROUTES.JOBS, locale });

  return <AnalyzeContent />;
}
