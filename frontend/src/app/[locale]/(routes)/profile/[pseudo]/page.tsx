import { Suspense } from "react";
import { PageLayout } from "@/components/layout";
import { ProfileBody } from "@/components/pages/profile/ProfileBody";
import {
  ProfileName,
  ProfileBackButton,
} from "@/components/pages/profile/ProfileHeader";
import { ProfileTitle } from "@/components/pages/profile/ProfileTitle";
import {
  ProfileHeaderSkeleton,
  ProfileBodySkeleton,
} from "@/components/pages/profile/ProfileSkeleton";

interface Props {
  params: Promise<{ pseudo: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { pseudo } = await params;

  return (
    <PageLayout
      fullHeight
      title={
        <ProfileTitle
          pseudo={pseudo}
          streamedName={
            <Suspense fallback={<ProfileHeaderSkeleton />}>
              <ProfileName pseudo={pseudo} />
            </Suspense>
          }
          backSlot={
            <Suspense fallback={null}>
              <ProfileBackButton pseudo={pseudo} />
            </Suspense>
          }
        />
      }
    >
      <Suspense fallback={<ProfileBodySkeleton />}>
        <ProfileBody pseudo={pseudo} />
      </Suspense>
    </PageLayout>
  );
}
