import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/layout";
import { UserData } from "@/types";

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
            <strong>{tHome("name")}:</strong> {user.first_name}{" "}
            {user.last_name}
          </li>
          <li>
            <strong>{tHome("pseudo")}:</strong> {user.pseudo}
          </li>
          <li>
            <strong>{tHome("dob")}:</strong> {user.dob}
          </li>
          {user.phone && (
            <li>
              <strong>{t("phone")}:</strong> {user.phone}
            </li>
          )}
          {user.nationality && (
            <li>
              <strong>{t("nationality")}:</strong> {user.nationality}
            </li>
          )}
          {user.location && (
            <li>
              <strong>{t("location")}:</strong> {user.location}
            </li>
          )}
        </ul>
      )}
    </PageLayout>
  );
};
