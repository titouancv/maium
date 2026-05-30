import { Suspense } from "react";
import { PageLayout } from "@/components/layout";
import { ProfileBody } from "@/components/profile/ProfileBody";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import {
  ProfileHeaderSkeleton,
  ProfileBodySkeleton,
} from "@/components/profile/ProfileSkeleton";

interface Props {
  params: Promise<{ pseudo: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { pseudo } = await params;

  return (
    <PageLayout
      fullHeight
      title={
        <Suspense fallback={<ProfileHeaderSkeleton />}>
          <ProfileHeader pseudo={pseudo} />
        </Suspense>
      }
    >
      <Suspense fallback={<ProfileBodySkeleton />}>
        <ProfileBody pseudo={pseudo} />
      </Suspense>
    </PageLayout>
  );
}
