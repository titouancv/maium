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
    <div className="bg-secondary flex w-full justify-center rounded-sm px-4 py-1 text-center">
      <p className="text-on-primary font-extrabold">
        {t("joinRank", { rank: formatOrdinal(rank, locale) })}
      </p>
    </div>
  );
}
