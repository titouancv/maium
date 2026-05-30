"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { API, ROUTES } from "@/constants";
import { Button, ChipList, Section } from "@/components/ui";
import { ExperienceList } from "@/components/ui";
import type { PublicUserData } from "@/types";
import { PageLayout } from "../layout";
import { HobbyList, SocialNetworkItem, UrlItem } from "@/components/ui";

interface ProfileContentProps {
  user: PublicUserData;
  isOwner: boolean;
  isFollowing?: boolean;
  isAuthenticated?: boolean;
}

export const ProfileContent = ({
  user,
  isOwner,
  isFollowing: initialIsFollowing = false,
  isAuthenticated = false,
}: ProfileContentProps) => {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [following, setFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(user.followers_count);
  const [isPending, startTransition] = useTransition();
  const [isMessagePending, startMessageTransition] = useTransition();

  const handleMessage = () => {
    if (!isAuthenticated) {
      router.push(ROUTES.SIGNUP);
      return;
    }
    startMessageTransition(async () => {
      const res = await fetch(API.MESSAGES_CONVERSATIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPseudo: user.pseudo }),
      });
      if (res.ok) {
        const { conversationId } = await res.json();
        router.push(ROUTES.CONVERSATION(conversationId));
      }
    });
  };

  const handleFollowToggle = () => {
    if (!isAuthenticated) {
      router.push(ROUTES.SIGNUP);
      return;
    }
    const next = !following;
    setFollowing(next);
    setFollowerCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const res = await fetch(API.USERS_FOLLOW, {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo: user.pseudo }),
      });
      if (!res.ok) {
        setFollowing(!next);
        setFollowerCount((c) => c + (next ? -1 : 1));
      }
    });
  };

  const hasProfessional = (user.professional_experiences?.length ?? 0) > 0;
  const hasEducational = (user.educational_experiences?.length ?? 0) > 0;
  const hasPersonal = (user.personal_experiences?.length ?? 0) > 0;
  const hasProjects = (user.projects?.length ?? 0) > 0;
  const hasHobbies = (user.hobbies?.length ?? 0) > 0;
  const hasSkills = (user.skills?.length ?? 0) > 0;
  const hasSocialNetworks = (user.social_networks?.length ?? 0) > 0;

  return (
    <PageLayout
      title={`${user.first_name} ${user.last_name}`}
      fullHeight
      backLabel={isOwner ? undefined : tCommon("backButton")}
    >
      <div className="flex h-full w-full max-w-7xl flex-col gap-8 pt-0 md:flex-row">
        <aside className="flex flex-col gap-8 md:w-1/5">
          <div className="flex flex-col gap-1">
            <p className="text-base">@{user.pseudo}</p>
            {user.location && (
              <p className="text-txt-muted text-sm">{user.location}</p>
            )}
            <div className="flex gap-3 pt-1">
              <Link href={ROUTES.PROFILE_FOLLOWERS(user.pseudo)}>
                <Button
                  variant="ghost"
                  size="none"
                  type="button"
                  className="w-full"
                >
                  {t("followers", { count: followerCount })}
                </Button>
              </Link>
              <Link href={ROUTES.PROFILE_FOLLOWING(user.pseudo)}>
                <Button
                  variant="ghost"
                  size="none"
                  type="button"
                  className="w-full"
                >
                  {t("following", { count: user.following_count })}
                </Button>
              </Link>
            </div>
          </div>
          {isOwner ? (
            <Link href={ROUTES.SETTINGS}>
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="w-full"
              >
                {t("settingsButton")}
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                variant={following ? "outline" : "primary"}
                size="sm"
                type="button"
                className="w-full"
                onClick={handleFollowToggle}
                disabled={isPending}
              >
                {following ? t("unfollowButton") : t("followButton")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="w-full"
                onClick={handleMessage}
                disabled={isMessagePending}
              >
                {t("messageButton")}
              </Button>
            </div>
          )}
        </aside>

        <main className="flex flex-1 flex-col gap-8 md:min-h-0 md:w-3/5 md:overflow-y-auto">
          {user.bio && <p>{user.bio}</p>}
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
    </PageLayout>
  );
};
