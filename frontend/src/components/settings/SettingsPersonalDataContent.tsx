"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { PageLayout } from "@/components/layout";
import { MenuList } from "@/components/ui";
import {
  EditInfoOverlay,
  type EditableField,
} from "./collections/EditInfoOverlay";
import type { UserData } from "@/types";
import { formatTimestampToDate } from "@/lib/date";

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
    <PageLayout title={t("personalDataMenuLabel")} backLabel={t("backButton")}>
      {user && (
        <div className="flex w-full max-w-2xl flex-col gap-12">
          <MenuList
            items={[
              {
                label: tHome("name"),
                value: `${user.first_name} ${user.last_name}`,
                onClick: () => setEditingField("name"),
              },
              {
                label: tHome("pseudo"),
                value: user.pseudo ?? undefined,
                onClick: () => setEditingField("pseudo"),
              },
              {
                label: tHome("dob"),
                value:
                  user.dob != null ? formatTimestampToDate(user.dob) : undefined,
                onClick: () => setEditingField("dob"),
              },
              {
                label: t("bio"),
                value: user.bio ?? undefined,
                onClick: () => setEditingField("bio"),
              },
              {
                label: t("phone"),
                value: user.phone ?? undefined,
                onClick: () => setEditingField("phone"),
              },
              {
                label: t("nationality"),
                value: user.nationality ?? undefined,
                onClick: () => setEditingField("nationality"),
              },
              {
                label: t("location"),
                value: user.location ?? undefined,
                onClick: () => setEditingField("location"),
              },
            ]}
          />
          <MenuList
            items={[
              {
                label: t("professionalExperiencesLabel"),
                value: user.professional_experiences?.length
                  ? String(user.professional_experiences.length)
                  : undefined,
                onClick: () => setEditingField("professionalExperiences"),
              },
              {
                label: t("educationalExperiencesLabel"),
                value: user.educational_experiences?.length
                  ? String(user.educational_experiences.length)
                  : undefined,
                onClick: () => setEditingField("educationalExperiences"),
              },
              {
                label: t("personalExperiences"),
                value: user.personal_experiences?.length
                  ? String(user.personal_experiences.length)
                  : undefined,
                onClick: () => setEditingField("personalExperiences"),
              },
            ]}
          />
          <MenuList
            items={[
              {
                label: t("skills"),
                value: user.skills?.length
                  ? String(user.skills.length)
                  : undefined,
                onClick: () => setEditingField("skills"),
              },
              {
                label: t("socialNetworks"),
                value: user.social_networks?.length
                  ? String(user.social_networks.length)
                  : undefined,
                onClick: () => setEditingField("socialNetworks"),
              },
              {
                label: t("projects"),
                value: user.projects?.length
                  ? String(user.projects.length)
                  : undefined,
                onClick: () => setEditingField("projects"),
              },
              {
                label: t("hobbies"),
                value: user.hobbies?.length
                  ? String(user.hobbies.length)
                  : undefined,
                onClick: () => setEditingField("hobbies"),
              },
            ]}
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
