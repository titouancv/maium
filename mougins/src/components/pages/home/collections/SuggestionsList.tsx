"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import type { SuggestedUser } from "@/types";
import { SuggestionCard } from "../items";

interface SuggestionsListProps {
  suggestionsPromise: Promise<SuggestedUser[]>;
  /** Hidden on the public landing, where following isn't the point yet. */
  showFollow?: boolean;
}

export const SuggestionsList = ({
  suggestionsPromise,
  showFollow = true,
}: SuggestionsListProps) => {
  const t = useTranslations("home");
  const suggestions = use(suggestionsPromise);

  return (
    <div className="flex gap-6 overflow-x-auto">
      {suggestions.length === 0 ? (
        <p className="text-txt-muted text-sm">{t("suggestions.empty")}</p>
      ) : (
        <>
          {suggestions.map((user) => (
            <SuggestionCard
              key={user.pseudo}
              user={user}
              showFollow={showFollow}
            />
          ))}
        </>
      )}
    </div>
  );
};
