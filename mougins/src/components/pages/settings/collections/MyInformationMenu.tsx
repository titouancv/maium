"use client";

import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { MenuList } from "@/components/ui";
import {
  EDITABLE_FIELDS,
  EditInfoOverlay,
  type EditableField,
} from "./EditInfoOverlay";
import { EditProfilePhotoOverlay } from "./EditProfilePhotoOverlay";
import { EditPhotoGalleryOverlay } from "./EditPhotoGalleryOverlay";
import type { UserData } from "@/types";
import { formatTimestampToDate } from "@/lib/date";

interface MyInformationMenuProps {
  userPromise: Promise<UserData | null>;
}

const isEditableField = (value: string | null): value is EditableField =>
  EDITABLE_FIELDS.includes(value as EditableField);

const countOf = (items?: unknown[] | null) =>
  items?.length ? String(items.length) : undefined;

export const MyInformationMenu = ({ userPromise }: MyInformationMenuProps) => {
  const user = use(userPromise);
  const t = useTranslations("settings");
  const tHome = useTranslations("home");
  const tGender = useTranslations("gender");
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedField = searchParams.get("field");
  const [editingField, setEditingField] = useState<EditableField | null>(() =>
    isEditableField(requestedField) ? requestedField : null,
  );
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [editingGallery, setEditingGallery] = useState(
    () => requestedField === "photos",
  );

  const handleSaved = () => router.refresh();

  if (!user) return null;

  return (
    <>
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
              label: t("profilePhoto"),
              value: user.profile_photo ? t("profilePhotoSet") : undefined,
              onClick: () => setEditingPhoto(true),
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
              label: tHome("dob"),
              value:
                user.dob != null ? formatTimestampToDate(user.dob) : undefined,
              onClick: () => setEditingField("dob"),
            },
            {
              label: t("gender"),
              value: user.gender ? tGender(user.gender) : undefined,
              onClick: () => setEditingField("gender"),
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
          ]}
        />

        <MenuList
          items={[
            {
              label: t("bio"),
              value: user.bio ?? undefined,
              onClick: () => setEditingField("bio"),
            },
            {
              label: t("photos"),
              value: countOf(user.photos),
              onClick: () => setEditingGallery(true),
            },
            {
              label: t("hobbies"),
              value: countOf(user.hobbies),
              onClick: () => setEditingField("hobbies"),
            },
          ]}
        />

        <MenuList
          items={[
            {
              label: t("professionalExperiencesLabel"),
              value: countOf(user.professional_experiences),
              onClick: () => setEditingField("professionalExperiences"),
            },
            {
              label: t("educationalExperiencesLabel"),
              value: countOf(user.educational_experiences),
              onClick: () => setEditingField("educationalExperiences"),
            },
            {
              label: t("personalExperiences"),
              value: countOf(user.personal_experiences),
              onClick: () => setEditingField("personalExperiences"),
            },
          ]}
        />

        <MenuList
          items={[
            {
              label: t("projects"),
              value: countOf(user.projects),
              onClick: () => setEditingField("projects"),
            },
          ]}
        />

        <MenuList
          items={[
            {
              label: t("skills"),
              value: countOf(user.skills),
              onClick: () => setEditingField("skills"),
            },
            {
              label: t("socialNetworks"),
              value: countOf(user.social_networks),
              onClick: () => setEditingField("socialNetworks"),
            },
          ]}
        />
      </div>

      {editingField && (
        <EditInfoOverlay
          field={editingField}
          user={user}
          onClose={() => setEditingField(null)}
          onSaved={handleSaved}
        />
      )}

      {editingPhoto && (
        <EditProfilePhotoOverlay
          user={user}
          onClose={() => setEditingPhoto(false)}
          onSaved={handleSaved}
        />
      )}

      {editingGallery && (
        <EditPhotoGalleryOverlay
          photos={user.photos ?? []}
          onClose={() => setEditingGallery(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
};
