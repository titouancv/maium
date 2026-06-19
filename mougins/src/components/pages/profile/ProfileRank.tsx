import { getLocale, getTranslations } from "next-intl/server";
import { getProfileRank } from "@/lib/users";
import { formatOrdinal } from "@/lib/utils";

/** Streamed "Nth on maium" join rank (round-trip 2). */
export async function ProfileRank({ pseudo }: { pseudo: string }) {
  const rank = await getProfileRank(pseudo);
  if (!rank) return null;

  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("profile"),
  ]);

  return (
    <div className="flex w-full">
      <p className="text-secondary font-extrabold">
        {t("joinRank", { rank: formatOrdinal(rank, locale) })}
      </p>
    </div>
  );
}
