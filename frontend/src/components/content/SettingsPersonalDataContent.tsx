"use client";

import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/layout";

interface UserData {
  email: string;
  first_name: string;
  last_name: string;
  pseudo: string;
  dob: string;
}

interface SettingsPersonalDataContentProps {
  user: UserData | null;
}

export const SettingsPersonalDataContent = ({
  user,
}: SettingsPersonalDataContentProps) => {
  const t = useTranslations("settings");
  const tHome = useTranslations("home");

  return (
    <PageLayout title={t("mesInformations")} backLabel={t("backButton")}>
      {user && (
        <ul className="space-y-2">
          <li>
            <strong>{tHome("email")}:</strong> {user.email}
          </li>
          <li>
            <strong>{tHome("name")}:</strong> {user.first_name} {user.last_name}
          </li>
          <li>
            <strong>{tHome("pseudo")}:</strong> {user.pseudo}
          </li>
          <li>
            <strong>{tHome("dob")}:</strong> {user.dob}
          </li>
        </ul>
      )}
    </PageLayout>
  );
};
