"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { EmptyState, ScrollRow } from "@/components/ui";
import type { SuggestedUser } from "@/types";
import { SuggestionCard } from "../items";

interface SuggestionsListProps {
  suggestionsPromise: Promise<SuggestedUser[]>;
  showFollow?: boolean;
}

export const SuggestionsList = ({
  suggestionsPromise,
  showFollow = true,
}: SuggestionsListProps) => {
  const t = useTranslations("home");
  const suggestions = use(suggestionsPromise);

  return (
    <ScrollRow>
      {suggestions.length === 0 ? (
        <EmptyState label={t("suggestions.empty")} />
      ) : (
        suggestions.map((user) => (
          <SuggestionCard
            key={user.pseudo}
            user={user}
            showFollow={showFollow}
          />
        ))
      )}
    </ScrollRow>
  );
};
