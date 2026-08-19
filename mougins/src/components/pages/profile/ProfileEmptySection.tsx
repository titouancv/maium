"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/constants";
import { Button, EmptyState, Section, Text } from "@/components/ui";

export type EmptySectionKey =
  | "photos"
  | "bio"
  | "hobbies"
  | "professionalExperiences"
  | "educationalExperiences"
  | "personalExperiences"
  | "projects"
  | "skills"
  | "socialNetworks";

const ProfileCompletePrompt = ({
  descriptionKey,
}: {
  descriptionKey: EmptySectionKey;
}) => {
  const t = useTranslations("profile");

  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <Text tone="muted" size="sm">
        {t(`emptySectionDescriptions.${descriptionKey}`)}
      </Text>
      <Link
        href={{
          pathname: ROUTES.SETTINGS_MY_INFORMATION,
          query: { field: descriptionKey },
        }}
      >
        <Button variant="outline" size="sm" type="button">
          {t("emptySectionAction")}
        </Button>
      </Link>
    </div>
  );
};

interface ProfileMissingSectionProps {
  isOwner: boolean;
  title: string;
  descriptionKey: EmptySectionKey;
}

export const ProfileMissingSection = ({
  isOwner,
  title,
  descriptionKey,
}: ProfileMissingSectionProps) => {
  if (!isOwner) return null;

  return (
    <Section title={title}>
      <ProfileCompletePrompt descriptionKey={descriptionKey} />
    </Section>
  );
};

export const ProfileEmptySection = () => {
  const t = useTranslations("profile");

  return <EmptyState label={t("emptySection")} align="center" />;
};
