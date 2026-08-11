"use client";

import { useTranslations } from "next-intl";
import { GoogleSignInButton } from "@/components/ui/GoogleSignInButton";
import { Title } from "@/components/ui/Title";

/**
 * Shown once the free run is spent — on return, or on a `402` from the API.
 *
 * The pitch leans on what signing up actually recovers: the CV is already
 * parsed and the finished analysis is waiting, so creating an account is three
 * questions rather than starting over (see `claimAnonSession`).
 */
export function AnonQuotaGate() {
  const t = useTranslations("analyze.gate");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Title label={t("title")} size="h2" />
        <p className="text-txt-muted text-sm">{t("description")}</p>
      </div>

      <ul className="text-txt-muted flex flex-col gap-1 text-sm">
        <li>{t("benefitProfile")}</li>
        <li>{t("benefitHistory")}</li>
        <li>{t("benefitUnlimited")}</li>
      </ul>

      <GoogleSignInButton />
    </div>
  );
}
