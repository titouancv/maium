"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/layout";
import { TextInput, LocationInput, Button } from "@/components/ui";
import { API } from "@/constants";
import { UserData } from "@/types";

interface SettingsPersonalDataContentProps {
  user: UserData | null;
}

export const SettingsPersonalDataContent = ({
  user,
}: SettingsPersonalDataContentProps) => {
  const t = useTranslations("settings");
  const tHome = useTranslations("home");

  const [phone, setPhone] = useState(user?.phone ?? "");
  const [nationality, setNationality] = useState(user?.nationality ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await fetch(API.USERS_ME, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, nationality, location }),
    });
    setIsSaving(false);
  };

  return (
    <PageLayout title={t("mesInformations")} backLabel={t("backButton")}>
      {user && (
        <div className="flex flex-col gap-6">
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
          </ul>
          <div className="flex flex-col gap-3">
            <TextInput
              placeholder={t("phonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <TextInput
              placeholder={t("nationalityPlaceholder")}
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
            />
            <LocationInput
              placeholder={t("locationPlaceholder")}
              value={location}
              onChange={setLocation}
            />
            <Button
              variant="outline"
              onClick={handleSave}
              isLoading={isSaving}
            >
              {t("saveButton")}
            </Button>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
