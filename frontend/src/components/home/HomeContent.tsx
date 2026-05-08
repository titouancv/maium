"use client";

import { useTranslations } from "next-intl";
import { useUserStore } from "@/stores/useUserStore";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import { useRouter } from "@/i18n/navigation";
import { Section, Title } from "../ui";
import { Card } from "../ui/Card";

export const HomeContent = () => {
  const t = useTranslations("home");
  const { user } = useUserStore();
  const router = useRouter();

  return (
    <div className="bg-surface-50 flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Title label={t("title")} size="h1" />
      {user && user.email ? (
        <Card padding="lg" variant="inverse" className="max-w-md">
          <Section title={t("userData")} padding="lg">
            <ul className="space-y-2">
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
          </Section>
        </Card>
      ) : (
        <Button onClick={() => router.push(ROUTES.SIGNUP)}>
          {t("signupButton")}
        </Button>
      )}
    </div>
  );
};
