"use client";

import { useTranslations } from "next-intl";
import { ChipList, ProfilePhoto, Section, Text } from "@/components/ui";
import { ExperienceList } from "@/components/ui";
import type { UserData } from "@/types";
import { HobbyList, SocialNetworkItem, UrlItem } from "@/components/ui";

interface ProfileContentProps {
  user: UserData;
  followSlot: React.ReactNode;
  rankSlot: React.ReactNode;
}

export const ProfileContent = ({
  user,
  followSlot,
  rankSlot,
}: ProfileContentProps) => {
  const t = useTranslations("profile");

  const displayName = {
    firstName: user.first_name,
    lastName: user.last_name,
  };
  const hasProfessional = (user.professional_experiences?.length ?? 0) > 0;
  const hasEducational = (user.educational_experiences?.length ?? 0) > 0;
  const hasPersonal = (user.personal_experiences?.length ?? 0) > 0;
  const hasProjects = (user.projects?.length ?? 0) > 0;
  const hasHobbies = (user.hobbies?.length ?? 0) > 0;
  const hasSkills = (user.skills?.length ?? 0) > 0;
  const hasSocialNetworks = (user.social_networks?.length ?? 0) > 0;

  return (
    <div className="flex h-full w-full max-w-7xl flex-col gap-8 pt-0 md:flex-row">
      <aside className="flex flex-col gap-8 md:w-1/5">
        <div className="flex flex-col gap-4">
          <div className="px-4 md:px-0">
            <ProfilePhoto
              pseudo={user.pseudo}
              src={user.profile_photo}
              displayName={displayName}
              hideNameOnDesktop
            />
          </div>
          <div className="flex flex-col gap-1">
            <Text>@{user.pseudo}</Text>
            {user.location && (
              <Text tone="muted" size="sm">
                {user.location}
              </Text>
            )}
          </div>
          {rankSlot}
          {followSlot}
        </div>
      </aside>

      <main className="flex flex-1 flex-col gap-8 md:min-h-0 md:w-3/5 md:overflow-y-auto">
        {user.bio && <p className="whitespace-pre-line">{user.bio}</p>}
        {hasProfessional && (
          <Section title={t("professionalExperiences")}>
            <ExperienceList experiences={user.professional_experiences!} />
          </Section>
        )}
        {hasEducational && (
          <Section title={t("educationalExperiences")}>
            <ExperienceList experiences={user.educational_experiences!} />
          </Section>
        )}
        {hasPersonal && (
          <Section title={t("personalExperiences")}>
            <ExperienceList experiences={user.personal_experiences!} />
          </Section>
        )}
        {hasHobbies && (
          <Section title={t("hobbies")}>
            <HobbyList hobbies={user.hobbies!} />
          </Section>
        )}
        <div className="h-0 shrink-0 md:h-32" />
      </main>

      <aside className="flex flex-col gap-8 md:w-1/5">
        {hasSkills && (
          <Section title={t("skills")}>
            <ChipList items={user.skills!} variant="outlineMuted" />
          </Section>
        )}
        {hasSocialNetworks && (
          <Section title={t("socialNetworks")}>
            <div className="flex flex-col gap-2">
              {user.social_networks!.map((url, i) => (
                <SocialNetworkItem url={url} key={i} />
              ))}
            </div>
          </Section>
        )}
        {hasProjects && (
          <Section title={t("projects")}>
            <div className="flex flex-col gap-2">
              {user.projects!.map((url, i) => (
                <UrlItem url={url} key={i} />
              ))}
            </div>
          </Section>
        )}
      </aside>
      <div className="h-24 shrink-0 md:h-0" />
    </div>
  );
};
