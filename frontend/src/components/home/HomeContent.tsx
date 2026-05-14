"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import { useRouter } from "@/i18n/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { Section, Title } from "../ui";
import { Card } from "../ui/Card";

interface UserData {
  email: string;
  first_name: string;
  last_name: string;
  pseudo: string;
  dob: string;
}

interface HomeContentProps {
  user: UserData | null;
}

export const HomeContent = ({ user }: HomeContentProps) => {
  const t = useTranslations("home");
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push(ROUTES.HOME);
    router.refresh();
  };

  return (
    <div className="bg-surface-50 flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Title label={t("title")} size="h1" />
      {user ? (
        <Card padding="lg" variant="inverse" className="max-w-md">
          <Section title={t("userData")} padding="lg">
            <ul className="space-y-2">
              <li>
                <strong>{t("email")}:</strong> {user.email}
              </li>
              <li>
                <strong>{t("name")}:</strong> {user.first_name} {user.last_name}
              </li>
              <li>
                <strong>{t("pseudo")}:</strong> {user.pseudo}
              </li>
              <li>
                <strong>{t("dob")}:</strong> {user.dob}
              </li>
            </ul>
          </Section>
          <Button variant="outline" onClick={handleLogout}>
            {t("logoutButton")}
          </Button>
        </Card>
      ) : (
        <Button onClick={() => router.push(ROUTES.SIGNUP)}>
          {t("signupButton")}
        </Button>
      )}
    </div>
  );
};
