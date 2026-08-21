"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChipList, ProfilePhoto, Section, Tabs, Text } from "@/components/ui";
import { ExperienceList } from "@/components/ui";
import type { UserData } from "@/types";
import { HobbyList, ProjectList, SocialNetworkItem } from "@/components/ui";
import { ProfilePhotoGallery } from "./collections";
import {
  ProfileEmptySection,
  ProfileMissingSection,
} from "./ProfileEmptySection";
import { skillChatUrl } from "@/lib/skills";

interface ProfileContentProps {
  user: UserData;
  isOwner: boolean;
  followSlot: React.ReactNode;
  rankSlot: React.ReactNode;
}

const OVERVIEW_TAB = 0;
const EXPERIENCE_TAB = 1;
const PROJECTS_TAB = 2;
const SKILLS_LINKS_TAB = 3;

export const ProfileContent = ({
  user,
  isOwner,
  followSlot,
  rankSlot,
}: ProfileContentProps) => {
  const t = useTranslations("profile");
  const [activeTab, setActiveTab] = useState(OVERVIEW_TAB);

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
  const hasPhotos = (user.photos?.length ?? 0) > 0;
  const hasOverview = Boolean(user.bio) || hasHobbies || hasPhotos;
  const hasExperience = hasProfessional || hasEducational || hasPersonal;
  const hasSkillsOrLinks = hasSkills || hasSocialNetworks;

  return (
    <div className="flex w-full max-w-7xl flex-col gap-8 pt-0 md:h-full md:flex-row">
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

      <main className="flex flex-1 flex-col gap-6 md:min-h-0 md:overflow-y-auto">
        <div className="bg-surface-50 sticky top-0 z-4 -mb-6 flex pb-4 md:pb-6">
          <Tabs
            tabs={[
              t("tabOverview"),
              t("tabExperience"),
              t("tabProjects"),
              t("tabSkillsLinks"),
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
            layoutId="activeProfileTab"
          />
        </div>

        <div className="flex flex-col gap-8">
          {activeTab === OVERVIEW_TAB &&
            (hasOverview || isOwner ? (
              <>
                {user.bio ? (
                  <Text className="whitespace-pre-line">{user.bio}</Text>
                ) : (
                  <ProfileMissingSection
                    isOwner={isOwner}
                    title={t("bio")}
                    descriptionKey="bio"
                  />
                )}
                {hasPhotos ? (
                  <ProfilePhotoGallery photos={user.photos!} />
                ) : (
                  <ProfileMissingSection
                    isOwner={isOwner}
                    title={t("photos")}
                    descriptionKey="photos"
                  />
                )}
                {hasHobbies ? (
                  <Section title={t("hobbies")}>
                    <HobbyList hobbies={user.hobbies!} />
                  </Section>
                ) : (
                  <ProfileMissingSection
                    isOwner={isOwner}
                    title={t("hobbies")}
                    descriptionKey="hobbies"
                  />
                )}
              </>
            ) : (
              <ProfileEmptySection />
            ))}

          {activeTab === EXPERIENCE_TAB &&
            (hasExperience || isOwner ? (
              <>
                {hasProfessional ? (
                  <Section title={t("professionalExperiences")}>
                    <ExperienceList
                      experiences={user.professional_experiences!}
                    />
                  </Section>
                ) : (
                  <ProfileMissingSection
                    isOwner={isOwner}
                    title={t("professionalExperiences")}
                    descriptionKey="professionalExperiences"
                  />
                )}
                {hasEducational ? (
                  <Section title={t("educationalExperiences")}>
                    <ExperienceList
                      experiences={user.educational_experiences!}
                    />
                  </Section>
                ) : (
                  <ProfileMissingSection
                    isOwner={isOwner}
                    title={t("educationalExperiences")}
                    descriptionKey="educationalExperiences"
                  />
                )}
                {hasPersonal ? (
                  <Section title={t("personalExperiences")}>
                    <ExperienceList experiences={user.personal_experiences!} />
                  </Section>
                ) : (
                  <ProfileMissingSection
                    isOwner={isOwner}
                    title={t("personalExperiences")}
                    descriptionKey="personalExperiences"
                  />
                )}
              </>
            ) : (
              <ProfileEmptySection />
            ))}

          {activeTab === PROJECTS_TAB &&
            (hasProjects ? (
              <ProjectList projects={user.projects!} />
            ) : isOwner ? (
              <ProfileMissingSection
                isOwner={isOwner}
                title={t("projects")}
                descriptionKey="projects"
              />
            ) : (
              <ProfileEmptySection />
            ))}

          {activeTab === SKILLS_LINKS_TAB &&
            (hasSkillsOrLinks || isOwner ? (
              <>
                {hasSkills ? (
                  <Section title={t("skills")}>
                    <ChipList
                      items={user.skills!}
                      variant="outlineMuted"
                      getHref={(skill) =>
                        skillChatUrl(t("skillPrompt", { skill }))
                      }
                    />
                  </Section>
                ) : (
                  <ProfileMissingSection
                    isOwner={isOwner}
                    title={t("skills")}
                    descriptionKey="skills"
                  />
                )}
                {hasSocialNetworks ? (
                  <Section title={t("socialNetworks")}>
                    <div className="flex flex-col gap-2">
                      {user.social_networks!.map((url, i) => (
                        <SocialNetworkItem url={url} key={i} />
                      ))}
                    </div>
                  </Section>
                ) : (
                  <ProfileMissingSection
                    isOwner={isOwner}
                    title={t("socialNetworks")}
                    descriptionKey="socialNetworks"
                  />
                )}
              </>
            ) : (
              <ProfileEmptySection />
            ))}
        </div>

        <div className="h-0 shrink-0 md:h-32" />
      </main>
      <div className="h-24 shrink-0 md:hidden" />
    </div>
  );
};
