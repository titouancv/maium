"use client";

import { useTranslations } from "next-intl";
import { useUserStore } from "@/stores/useUserStore";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import { useRouter } from "@/i18n/navigation";

export const HomeContent = () => {
  const t = useTranslations("home");
  const { user } = useUserStore();
  const router = useRouter();

  return (
    <div className="bg-surface-50 flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-txt mb-4 text-3xl font-bold">{t("title")}</h1>
      <p className="text-txt-muted mb-8">{t("description")}</p>

      {user && user.email ? (
        <div className="border-brd-200 bg-surface-100 rounded-2xl border p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">{t("userData")}</h2>
          <ul className="text-txt space-y-2">
            <li>
              <strong>{t("email")}:</strong> {user.email}
            </li>
            <li>
              <strong>{t("name")}:</strong> {user.firstName} {user.lastName}
            </li>
            <li>
              <strong>{t("pseudo")}:</strong> {user.pseudo}
            </li>
            <li>
              <strong>{t("dob")}:</strong> {user.dob}
            </li>
          </ul>
        </div>
      ) : (
        <Button onClick={() => router.push(ROUTES.SIGNUP)}>
          {t("signupButton")}
        </Button>
      )}
    </div>
  );
};
