import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Title, BackButton } from "@/components/ui";
import { getProfileBundle } from "@/lib/users";

/** Streamed header: the profile name + a back button for non-owners. */
export async function ProfileHeader({ pseudo }: { pseudo: string }) {
  const [bundle, tCommon] = await Promise.all([
    getProfileBundle(pseudo),
    getTranslations("common"),
  ]);
  if (!bundle) notFound();

  return (
    <>
      <Title label={`${bundle.user.first_name} ${bundle.user.last_name}`} size="h1" />
      {!bundle.isOwner && <BackButton label={tCommon("backButton")} />}
    </>
  );
}
