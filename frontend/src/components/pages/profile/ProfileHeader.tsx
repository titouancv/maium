import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Title, BackButton } from "@/components/ui";
import { getProfileBundle } from "@/lib/users";

/** Streamed profile name (used when no preview was seeded on click). */
export async function ProfileName({ pseudo }: { pseudo: string }) {
  const bundle = await getProfileBundle(pseudo);
  if (!bundle) notFound();

  return (
    <div className="hidden md:flex">
      <Title
        label={`${bundle.user.first_name} ${bundle.user.last_name}`}
        size="h1"
      />
    </div>
  );
}

/** Streamed back button — shown for non-owners only (needs server auth). */
export async function ProfileBackButton({ pseudo }: { pseudo: string }) {
  const [bundle, tCommon] = await Promise.all([
    getProfileBundle(pseudo),
    getTranslations("common"),
  ]);
  if (!bundle || bundle.isOwner) return null;

  return <BackButton label={tCommon("backButton")} />;
}
