"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { PageLayout } from "@/components/layout";
import { InfoField } from "@/components/custom/settings/InfoField";
import {
  EditInfoOverlay,
  type EditableField,
} from "@/components/custom/settings/EditInfoOverlay";
import type { UserData } from "@/types";

interface SettingsPersonalDataContentProps {
  user: UserData | null;
}

export const SettingsPersonalDataContent = ({
  user,
}: SettingsPersonalDataContentProps) => {
  const t = useTranslations("settings");
  const tHome = useTranslations("home");
  const router = useRouter();
  const [editingField, setEditingField] = useState<EditableField | null>(null);

  const handleSaved = () => router.refresh();

  return (
    <PageLayout title={t("mesInformations")} backLabel={t("backButton")}>
      {user && (
        <div className="flex flex-col">
          <InfoField
            label={tHome("name")}
            value={`${user.first_name} ${user.last_name}`}
            onEdit={() => setEditingField("name")}
          />
          <InfoField
            label={tHome("pseudo")}
            value={user.pseudo}
            onEdit={() => setEditingField("pseudo")}
          />
          <InfoField
            label={tHome("dob")}
            value={user.dob}
            onEdit={() => setEditingField("dob")}
          />
          <InfoField
            label={t("phone")}
            value={user.phone}
            onEdit={() => setEditingField("phone")}
          />
          <InfoField
            label={t("nationality")}
            value={user.nationality}
            onEdit={() => setEditingField("nationality")}
          />
          <InfoField
            label={t("location")}
            value={user.location}
            onEdit={() => setEditingField("location")}
          />
          <InfoField
            label={t("professionalExperiencesLabel")}
            value={
              user.professional_experiences?.length
                ? String(user.professional_experiences.length)
                : undefined
            }
            onEdit={() => setEditingField("professionalExperiences")}
          />
          <InfoField
            label={t("educationalExperiencesLabel")}
            value={
              user.educational_experiences?.length
                ? String(user.educational_experiences.length)
                : undefined
            }
            onEdit={() => setEditingField("educationalExperiences")}
          />
        </div>
      )}

      {editingField && user && (
        <EditInfoOverlay
          field={editingField}
          user={user}
          onClose={() => setEditingField(null)}
          onSaved={handleSaved}
        />
      )}
    </PageLayout>
  );
};
